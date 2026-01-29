"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getDeviceId } from "@/lib/deviceId";
import { performGlobalResetOnce } from "@/lib/deviceAuth";

// Session timeout settings
const INACTIVITY_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours in milliseconds (for admin panel)
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

export default function SessionManager() {
  const router = useRouter();
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isMounted = useRef(true);

  // Reset inactivity timer
  const resetInactivityTimer = () => {
    lastActivityRef.current = Date.now();

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(async () => {
      await handleLogout(
        "Votre session a expiré en raison d'inactivité. Veuillez vous reconnecter.",
      );
    }, INACTIVITY_TIMEOUT);
  };

  // Handle logout
  const handleLogout = async (message?: string) => {
    await supabase.auth.signOut();

    if (message) {
      // Store message in sessionStorage to show on login page
      sessionStorage.setItem("logout_message", message);
    }

    router.push("/login");
  };

  // Check session validity
  const checkSession = async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      await handleLogout("Votre session a expiré. Veuillez vous reconnecter.");
      return;
    }

    // Check if token is expired
    const expiresAt = session.expires_at;
    if (expiresAt && expiresAt * 1000 < Date.now()) {
      await handleLogout("Votre session a expiré. Veuillez vous reconnecter.");
      return;
    }

    // Check inactivity
    const timeSinceLastActivity = Date.now() - lastActivityRef.current;
    if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
      await handleLogout(
        "Votre session a expiré en raison d'inactivité. Veuillez vous reconnecter.",
      );
      return;
    }
  };

  useEffect(() => {
    isMounted.current = true;
    // Trigger global reset migration if needed (one-time for v2)
    performGlobalResetOnce();

    // Track user activity
    const activityEvents = [
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Add event listeners
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    // Start inactivity timer
    resetInactivityTimer();

    // Set up periodic session check
    const sessionCheckInterval = setInterval(
      checkSession,
      SESSION_CHECK_INTERVAL,
    );

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        router.push("/login");
      } else if (event === "TOKEN_REFRESHED") {
        resetInactivityTimer();
      }
    });

    // ========================================================================
    // Realtime Session Listener - Instant Remote Logout
    // ========================================================================
    const setupRealtimeListener = async () => {
      try {
        const deviceId = await getDeviceId();

        if (!isMounted.current) return;

        const channel = supabase.channel(`session-web-${deviceId}`).on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "device_sessions",
            filter: `device_id=eq.${deviceId}`,
          },
          async () => {
            console.log(
              "[SessionManager] Session deleted remotely, forcing logout",
            );
            await handleLogout("Votre session a été révoquée à distance.");
          },
        );

        channelRef.current = channel;
        channel.subscribe((status) => {
          if (status === "SUBSCRIBED") {
            // Check if we unmounted while subscribing
            if (!isMounted.current && channelRef.current) {
              supabase.removeChannel(channelRef.current);
              channelRef.current = null;
            }
          }
        });
      } catch (error) {
        console.error(
          "[SessionManager] Failed to setup Realtime listener:",
          error,
        );
      }
    };

    setupRealtimeListener();

    // Cleanup
    return () => {
      isMounted.current = false;
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      clearInterval(sessionCheckInterval);
      subscription.unsubscribe();

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // This component doesn't render anything
  return null;
}
