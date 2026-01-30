// ============================================================================
// Root Layout - Crash-Safe Implementation
// ============================================================================

import "../global.css";

import { useEffect, useRef, useState, useCallback } from "react";
import { Stack } from "expo-router";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { StatusBar, Platform } from "react-native";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { queryClient, asyncStoragePersister } from "@/lib/query-client";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { AppVisibilityProvider } from "@/context/AppVisibilityContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { VideoSplashScreen } from "@/components/VideoSplashScreen";
import { MaintenanceScreen } from "@/components/MaintenanceScreen";

// Lazy-loaded modules - prevent crashes from top-level imports
let _Platform: typeof import("react-native").Platform | null = null;
let _supabase: typeof import("@/lib/supabase").supabase | null = null;
let _SplashScreen: typeof import("expo-splash-screen") | null = null;
let _Linking: typeof import("expo-linking") | null = null;
let _OfflineContentService:
  | typeof import("@/lib/offline-content").OfflineContentService
  | null = null;

// Load Platform safely
function getPlatform() {
  if (!_Platform) {
    try {
      _Platform = require("react-native").Platform;
    } catch {
      // Fallback
    }
  }
  return _Platform;
}

// Load supabase safely
function getSupabase() {
  if (!_supabase) {
    try {
      _supabase = require("@/lib/supabase").supabase;
    } catch {
      // Fallback
    }
  }
  return _supabase;
}

// Initialize native modules safely (only on native platforms)
function initNativeModules() {
  const platform = getPlatform();
  if (platform?.OS === "web") return;

  try {
    _SplashScreen = require("expo-splash-screen");
    // We remove preventAutoHideAsync so the native splash hides as soon as possible,
    // allowing our custom VideoSplashScreen to take over immediately.
    // _SplashScreen?.preventAutoHideAsync().catch(() => {});
  } catch {
    // Silent fail
  }

  try {
    _Linking = require("expo-linking");
  } catch {
    // Silent fail
  }
}

// Call init once at module load (but safely)
try {
  initNativeModules();
} catch {
  // Silent fail - app should still work
}

// Check offline content status on startup (no auto-download - user controls from profile)
async function checkOfflineContentStatus(): Promise<void> {
  const platform = getPlatform();
  if (platform?.OS === "web") return;

  try {
    if (!_OfflineContentService) {
      const module = require("@/lib/offline-content");
      _OfflineContentService = module.OfflineContentService;
    }

    if (!_OfflineContentService) return;

    // Just check status - don't auto-download (user controls from profile)
    const { hasUpdate, remoteVersion, error } =
      await _OfflineContentService.checkForUpdates();

    if (__DEV__) {
      if (error) {
        console.log("[Offline] Status check:", error);
      } else if (hasUpdate && remoteVersion) {
        console.log(
          `[Offline] Update available: v${remoteVersion.version} (${remoteVersion.total_questions} questions)`,
        );
      } else {
        const localVersion = await _OfflineContentService.getLocalVersion();
        if (localVersion) {
          console.log(
            `[Offline] Content ready: v${localVersion.version} (${localVersion.total_questions} questions)`,
          );
        } else {
          console.log(
            "[Offline] No local content - user can download from profile",
          );
        }
      }
    }
  } catch (error) {
    // Silent fail - don't interrupt user experience
    if (__DEV__) {
      console.warn("[Offline] Status check failed:", error);
    }
  }
}

function RootLayoutContent() {
  const { isDark, colors } = useTheme();
  const { user } = useAuth();
  const initStarted = useRef(false);
  const [isSplashAnimationFinished, setIsSplashAnimationFinished] =
    useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState<string>("");

  // Check if user is admin (bypass maintenance)
  const isAdminUser =
    user?.role === "owner" ||
    user?.role === "admin" ||
    user?.role === "manager";

  // Fetch maintenance mode status
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    const fetchMaintenanceStatus = async () => {
      try {
        const { data } = await supabase
          .from("app_config")
          .select("key, value")
          .in("key", ["maintenance_mode", "maintenance_message"]);

        if (data) {
          const modeRow = data.find((r) => r.key === "maintenance_mode");
          const msgRow = data.find((r) => r.key === "maintenance_message");
          setMaintenanceMode(modeRow?.value === "true");
          setMaintenanceMessage(msgRow?.value || "");
        }
      } catch (error) {
        if (__DEV__) {
          console.warn("[Maintenance] Failed to fetch status:", error);
        }
      }
    };

    fetchMaintenanceStatus();

    // Subscribe to realtime changes for instant updates
    const channel = supabase
      .channel("maintenance_mode_channel")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "app_config",
          filter: "key=eq.maintenance_mode",
        },
        (payload) => {
          if (__DEV__) {
            console.log("[Maintenance] Status changed:", payload.new.value);
          }
          setMaintenanceMode(payload.new.value === "true");
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Web doesn't need video splash
  useEffect(() => {
    if (Platform.OS === "web") {
      setIsSplashAnimationFinished(true);
    }
  }, []);

  useEffect(() => {
    const platform = getPlatform();
    if (platform?.OS === "web") return;

    if (initStarted.current) return;
    initStarted.current = true;

    const initApp = async () => {
      try {
        // Check offline content status (no auto-download)
        await Promise.race([
          checkOfflineContentStatus().catch(() => {}),
          new Promise((resolve) => setTimeout(resolve, 3000)),
        ]);
      } catch {
        // Silent fail
      }
      // Note: We do NOT hide splash screen here anymore.
      // The VideoSplashScreen component handles hiding the native splash
      // once the video is ready to play.
    };
    initApp();

    // Handle deep links for auth
    const handleDeepLink = async (url: string) => {
      if (url.includes("access_token") || url.includes("refresh_token")) {
        const params = new URLSearchParams(
          url.split("#")[1] || url.split("?")[1] || "",
        );
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          const supabase = getSupabase();
          await supabase?.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }
      }
    };

    const setImmersiveMode = async () => {
      const platform = getPlatform();
      if (platform?.OS === "web") return;

      try {
        // Hide top status bar
        StatusBar.setHidden(true, "fade");

        // Android specific navigation bar hiding
        if (platform?.OS === "android") {
          try {
            const NavigationBar = require("expo-navigation-bar");
            await NavigationBar.setVisibilityAsync("hidden");
            // These methods are not supported with edge-to-edge enabled and cause warnings
            // await NavigationBar.setBehaviorAsync('sticky-immersive')
            // await NavigationBar.setBackgroundColorAsync('#ffffff')
          } catch (e) {
            console.warn("[Immersive] NavigationBar control failed:", e);
          }
        }
      } catch (e) {
        console.warn("[Immersive] Status bar control failed:", e);
      }
    };

    // Apply immersive mode on mount
    setImmersiveMode();

    // Listen for incoming deep links
    const subscription = _Linking?.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    // Check if app was opened via deep link
    _Linking?.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  // Show video splash screen until animation is finished (on native)
  if (!isSplashAnimationFinished && Platform.OS !== "web") {
    return (
      <VideoSplashScreen onFinish={() => setIsSplashAnimationFinished(true)} />
    );
  }

  // Show maintenance screen if active (unless user is admin)
  if (maintenanceMode && !isAdminUser) {
    return <MaintenanceScreen message={maintenanceMessage} />;
  }

  return (
    <>
      <ExpoStatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth/callback" />
        <Stack.Screen
          name="module/[id]"
          options={{ headerShown: true, title: "Module" }}
        />
        <Stack.Screen
          name="practice/[moduleId]"
          options={{ headerShown: true, title: "Practice" }}
        />
        <Stack.Screen
          name="practice/results"
          options={{ headerShown: true, title: "Results" }}
        />
        <Stack.Screen
          name="saved/index"
          options={{ headerShown: true, title: "Saved Questions" }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: asyncStoragePersister }}
      >
        <AppVisibilityProvider>
          <ThemeProvider>
            <AuthProvider>
              <RootLayoutContent />
            </AuthProvider>
          </ThemeProvider>
        </AppVisibilityProvider>
      </PersistQueryClientProvider>
    </ErrorBoundary>
  );
}
