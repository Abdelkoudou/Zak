// ============================================================================
// Authentication Context
// ============================================================================

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { User, RegisterFormData, ProfileUpdateData } from "@/types";
import * as authService from "@/lib/auth";
import { getDeviceId } from "@/lib/deviceId";
import {
  supabase,
  ensureValidSession,
  getStoredSessionSync,
} from "@/lib/supabase";
import { useWebVisibility } from "@/lib/useWebVisibility";

// Lazy-loaded Platform
let _Platform: typeof import("react-native").Platform | null = null;
let _platformLoaded = false;

function getPlatformOS(): string {
  if (!_platformLoaded) {
    _platformLoaded = true;
    try {
      _Platform = require("react-native").Platform;
    } catch {
      _Platform = null;
    }
  }
  return _Platform?.OS || "unknown";
}

// ============================================================================
// Types
// ============================================================================

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (
    data: RegisterFormData,
  ) => Promise<{ error: string | null; needsEmailVerification?: boolean }>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
  updateProfile: (data: ProfileUpdateData) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  refreshUser: () => Promise<void>;
  getDeviceSessions: () => Promise<{ sessions: any[]; error: string | null }>;
  getUniqueDevices: () => Promise<{
    devices: any[];
    uniqueCount: number;
    error: string | null;
  }>;
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Track if we're currently checking session to prevent duplicate calls
  const isCheckingSession = useRef(false);
  // Track last successful session check time
  const lastSessionCheck = useRef<number>(0);
  // Minimum time between session checks (5 seconds for web, 30 seconds for native)
  const SESSION_CHECK_COOLDOWN = getPlatformOS() === "web" ? 5000 : 30000;
  // Track if initial load is complete
  const initialLoadComplete = useRef(false);
  // Track if we've subscribed to auth changes
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  // Track user-initiated signouts to distinguish from accidental ones (e.g., failed token refresh)
  const userInitiatedSignOut = useRef(false);

  // Check for existing session on mount
  useEffect(() => {
    let isMounted = true;

    // Safety timeout: ensure loading state is cleared after 8 seconds (increased for slow networks)
    const safetyTimeout = setTimeout(() => {
      if (isMounted && isLoading) {
        setIsLoading(false);
        initialLoadComplete.current = true;
      }
    }, 8000);

    const init = async () => {
      try {
        // Trigger global reset migration if needed (one-time for v2)
        await authService.performGlobalResetOnce();

        await checkSession();
      } catch (error) {
        if (__DEV__) {
          console.error("[Auth] Init error:", error);
        }
        setIsLoading(false);
      } finally {
        if (isMounted) {
          clearTimeout(safetyTimeout);
          initialLoadComplete.current = true;
        }
      }
    };

    init();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === "SIGNED_IN" && session) {
        // Don't refresh if we're already loading (prevents double fetch on init)
        if (!isLoading) {
          await refreshUser();
        }
      } else if (event === "SIGNED_OUT") {
        if (userInitiatedSignOut.current) {
          // User explicitly signed out — clear everything
          userInitiatedSignOut.current = false;
          setUser(null);
          setIsLoading(false);
        } else {
          // Unexpected signout (e.g., failed token refresh after app resume)
          // Try to recover the session before giving up
          if (__DEV__) {
            console.log(
              "[Auth] Unexpected SIGNED_OUT event — attempting session recovery...",
            );
          }
          try {
            const {
              data: { session: recoveredSession },
              error: recoveryError,
            } = await supabase.auth.refreshSession();

            if (recoveredSession && !recoveryError) {
              if (__DEV__) {
                console.log(
                  "[Auth] ✅ Session recovered after unexpected SIGNED_OUT",
                );
              }
              // Session recovered! Refresh user data and stay logged in
              await refreshUser();
              return;
            }
          } catch (recoveryException) {
            if (__DEV__) {
              console.warn(
                "[Auth] Session recovery failed:",
                recoveryException,
              );
            }
          }
          // Recovery failed — truly signed out
          if (__DEV__) {
            console.log(
              "[Auth] Session recovery failed — clearing user state",
            );
          }
          setUser(null);
          setIsLoading(false);
        }
      } else if (event === "TOKEN_REFRESHED" && session) {
        // Token was refreshed, ensure user data is still valid
      } else if (event === "PASSWORD_RECOVERY" && session) {
        // Password recovery event - user clicked reset link
        // Don't set user here, let the callback page handle the redirect
        setIsLoading(false);
      } else if (event === "INITIAL_SESSION") {
        // This is fired when Supabase loads the initial session from storage
        if (session && !user) {
          await refreshUser();
        } else if (!session) {
          // No session from Supabase
          // CRITICAL: Don't use cached profile without a session!
          // This causes "phantom login" where UI shows logged in but API calls fail
          // because RLS checks auth.uid() which returns NULL without a session.

          if (__DEV__) {
            console.log(
              "[Auth] INITIAL_SESSION: No session - clearing any cached profile",
            );
          }

          // Clear the stale cached profile to force re-login
          await authService.clearCachedUserProfile();
          setUser(null);
          setIsLoading(false);
        }
      } else if (event === "USER_UPDATED") {
        // User was updated (e.g., password changed)
        if (session) {
          await refreshUser();
        }
      }
    });

    subscriptionRef.current = subscription;

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // ============================================================================
  // Realtime Session Listener - Instant Remote Logout
  // ============================================================================
  useEffect(() => {
    if (!user) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let isMounted = true;

    const setupSessionListener = async () => {
      try {
        const deviceId = await getDeviceId();

        if (__DEV__) {
          console.log(
            "[Auth] Setting up Realtime listener for device:",
            deviceId,
          );
        }

        channel = supabase
          .channel(`session-${deviceId}`)
          .on(
            "postgres_changes",
            {
              event: "DELETE",
              schema: "public",
              table: "device_sessions",
              filter: `device_id=eq.${deviceId}`,
            },
            async (payload) => {
              if (!isMounted) return;

              if (__DEV__) {
                console.log("[Auth] Session deleted remotely, forcing logout");
              }

              // Force logout - session was deleted by admin
              await signOutInternal("Votre session a été révoquée à distance.");
            },
          )
          .subscribe((status) => {
            if (__DEV__) {
              console.log("[Auth] Realtime subscription status:", status);
            }
          });
      } catch (error) {
        if (__DEV__) {
          console.error("[Auth] Failed to setup session listener:", error);
        }
      }
    };

    setupSessionListener();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id]);

  // Internal sign out with optional message (used by Realtime listener)
  const signOutInternal = useCallback(async (message?: string) => {
    try {
      if (__DEV__) {
        console.log("[Auth] Signing out internally:", message);
      }

      // Mark as intentional so onAuthStateChange doesn't try to recover
      userInitiatedSignOut.current = true;

      // Clear user state immediately for instant feedback
      setUser(null);

      // Then do the actual sign out
      await authService.signOut();

      // Store message for display on login screen if needed
      if (message && typeof window !== "undefined") {
        sessionStorage?.setItem("logout_message", message);
      }
    } catch (error) {
      if (__DEV__) {
        console.error("[Auth] Internal signout error:", error);
      }
      // Even on error, ensure user is cleared
      setUser(null);
    }
  }, []);

  // Handle visibility changes - CRITICAL for both web tab switching AND native app resume
  const handleVisibilityChange = useCallback(
    async (isVisible: boolean, hiddenDuration: number) => {
      // Only handle when becoming visible
      if (!isVisible) return;

      // Wait for initial load to complete
      if (!initialLoadComplete.current) return;

      // Skip if we checked very recently (within 3 seconds)
      const timeSinceLastCheck = Date.now() - lastSessionCheck.current;
      if (timeSinceLastCheck < 3000) return;

      // Skip if already checking
      if (isCheckingSession.current) return;

      const isWebPlatform = getPlatformOS() === "web";

      try {
        isCheckingSession.current = true;

        if (isWebPlatform) {
          // ======== WEB PATH ========
          // First, check if there's a stored session
          const hasStoredSession = getStoredSessionSync();

          if (!hasStoredSession) {
            // No stored session - if we have a user, they've been logged out
            if (user) {
              setUser(null);
            }
            lastSessionCheck.current = Date.now();
            return;
          }

          // There's a stored session, verify it's still valid
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();

          if (error) {
            // Don't clear user on transient errors
            lastSessionCheck.current = Date.now();
            return;
          }

          if (!session) {
            // Session is gone but storage had something - might be corrupted
            if (user) {
              // Try to refresh the session
              const { error: refreshError } =
                await supabase.auth.refreshSession();
              if (refreshError) {
                setUser(null);
              }
            }
          } else if (user) {
            // Session exists and we have a user

            // IMPORTANT: Also check if device session still exists in DB
            // This catches cases where admin deleted the session while app was in background
            const sessionExists = await authService.verifySessionExists();
            if (!sessionExists) {
              if (__DEV__) {
                console.log(
                  "[Auth] Device session not found in DB, logging out",
                );
              }
              await signOutInternal("Votre session a été révoquée.");
              return;
            }

            // Optionally refresh user data if hidden for a while
            if (hiddenDuration > 60000) {
              await refreshUser();
            }
          } else {
            // Session exists but no user - this shouldn't happen, refresh user
            await refreshUser();
          }
        } else {
          // ======== NATIVE PATH (Android/iOS) ========
          // Proactively verify and refresh the session when returning from background.
          // This prevents Supabase's internal auto-refresh from firing SIGNED_OUT
          // on a transient network error during app resume.
          if (user && hiddenDuration > 2000) {
            if (__DEV__) {
              console.log(
                `[Auth] Native resume: verifying session (hidden for ${Math.round(hiddenDuration / 1000)}s)`,
              );
            }

            const {
              data: { session },
              error,
            } = await supabase.auth.getSession();

            if (error || !session) {
              // Session not in memory — try to refresh from refresh_token
              if (__DEV__) {
                console.log(
                  "[Auth] Native resume: session missing, attempting refresh...",
                );
              }
              const {
                data: { session: refreshedSession },
                error: refreshError,
              } = await supabase.auth.refreshSession();

              if (!refreshedSession || refreshError) {
                if (__DEV__) {
                  console.warn(
                    "[Auth] Native resume: session recovery failed",
                    refreshError?.message,
                  );
                }
                // Session truly lost — log out
                setUser(null);
              } else {
                if (__DEV__) {
                  console.log(
                    "[Auth] Native resume: ✅ session refreshed successfully",
                  );
                }
              }
            } else {
              // Session exists — proactively refresh if token is close to expiry
              const expiresAt = session.expires_at;
              if (expiresAt) {
                const now = Math.floor(Date.now() / 1000);
                const timeUntilExpiry = expiresAt - now;
                if (timeUntilExpiry < 300) {
                  // Less than 5 minutes — refresh proactively
                  if (__DEV__) {
                    console.log(
                      `[Auth] Native resume: proactive token refresh (expires in ${timeUntilExpiry}s)`,
                    );
                  }
                  await supabase.auth.refreshSession();
                }
              }

              // Refresh user data if hidden for a long time
              if (hiddenDuration > 60000) {
                await refreshUser();
              }
            }
          } else if (!user) {
            // No user but we might have a session (app was killed and restarted)
            const {
              data: { session },
            } = await supabase.auth.getSession();
            if (session) {
              await refreshUser();
            }
          }
        }

        lastSessionCheck.current = Date.now();
      } catch (error) {
        // Silent fail - don't disrupt user experience
        if (__DEV__) {
          console.warn("[Auth] Visibility change handler error:", error);
        }
      } finally {
        isCheckingSession.current = false;
      }
    },
    [user],
  );

  // Use the web visibility hook for proper tab visibility handling
  useWebVisibility({
    debounceMs: 100, // Quick response for better UX
    onVisibilityChange: handleVisibilityChange,
  });

  // Check for existing session
  const checkSession = async () => {
    if (isCheckingSession.current) return;

    try {
      isCheckingSession.current = true;
      const { user: currentUser } = await authService.getCurrentUser();
      setUser(currentUser);
      lastSessionCheck.current = Date.now();
    } catch (error) {
      if (__DEV__) {
        console.error("[Auth] Error checking session:", error);
      }
      // CRITICAL: Don't use cached profile without verifying session exists
      // This was causing "phantom login" states where UI showed logged in
      // but all API calls failed because RLS couldn't find auth.uid()
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        // Session exists, safe to use cached profile as fallback
        const cachedUser = await authService.getCachedUserProfile();
        if (cachedUser && cachedUser.id === session.user.id) {
          if (__DEV__) {
            console.log(
              "[Auth] checkSession: Using cached profile (session verified)",
            );
          }
          setUser(cachedUser);
        } else {
          setUser(null);
        }
      } else {
        // No session - clear cached profile to force re-login
        if (__DEV__) {
          console.log("[Auth] checkSession: No session - forcing re-login");
        }
        await authService.clearCachedUserProfile();
        setUser(null);
      }
    } finally {
      setIsLoading(false);
      isCheckingSession.current = false;
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      const { user: currentUser } = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      if (__DEV__) {
        console.error("[Auth] Error refreshing user:", error);
      }
    }
  };

  // Sign up
  const signUp = async (
    data: RegisterFormData,
  ): Promise<{ error: string | null; needsEmailVerification?: boolean }> => {
    try {
      setIsLoading(true);
      const {
        user: newUser,
        error,
        needsEmailVerification,
      } = await authService.signUp(data);

      if (error) {
        return { error };
      }

      if (needsEmailVerification) {
        return { error: null, needsEmailVerification: true };
      }

      setUser(newUser);
      return { error: null };
    } catch (error) {
      return { error: "An unexpected error occurred" };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in
  const signIn = async (
    email: string,
    password: string,
  ): Promise<{ error: string | null }> => {
    try {
      setIsLoading(true);
      const { user: loggedInUser, error } = await authService.signIn(
        email,
        password,
      );

      if (error) {
        return { error };
      }

      setUser(loggedInUser);
      return { error: null };
    } catch (error) {
      return { error: "An unexpected error occurred" };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const signOut = async (): Promise<{ error: string | null }> => {
    try {
      setIsLoading(true);

      // Mark as intentional so onAuthStateChange doesn't try to recover
      userInitiatedSignOut.current = true;

      const { error } = await authService.signOut();

      if (error) {
        return { error };
      }

      setUser(null);
      return { error: null };
    } catch (error) {
      return { error: "An unexpected error occurred" };
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (
    data: ProfileUpdateData,
  ): Promise<{ error: string | null }> => {
    if (!user) {
      return { error: "Not authenticated" };
    }

    try {
      const { user: updatedUser, error } = await authService.updateProfile(
        user.id,
        data,
      );

      if (error) {
        return { error };
      }

      setUser(updatedUser);
      return { error: null };
    } catch (error) {
      return { error: "An unexpected error occurred" };
    }
  };

  // Reset password
  const resetPassword = async (
    email: string,
  ): Promise<{ error: string | null }> => {
    return authService.resetPassword(email);
  };

  // Get device sessions
  const getDeviceSessions = async (): Promise<{
    sessions: any[];
    error: string | null;
  }> => {
    if (!user) {
      return { sessions: [], error: "Not authenticated" };
    }
    return authService.getDeviceSessions(user.id);
  };

  // Get unique physical devices (deduplicated by fingerprint)
  const getUniqueDevices = async (): Promise<{
    devices: any[];
    uniqueCount: number;
    error: string | null;
  }> => {
    if (!user) {
      return { devices: [], uniqueCount: 0, error: "Not authenticated" };
    }
    return authService.getUniqueDevices(user.id);
  };

  // Context value
  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    refreshUser,
    getDeviceSessions,
    getUniqueDevices,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

export default AuthContext;
