// ============================================================================
// Auth Callback - Handles deep link from email verification and password reset
// ============================================================================

import { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { BRAND_THEME } from "@/constants/theme";
import { AnimatedButton, FadeInView } from "@/components/ui";

// Constants
const RECOVERY_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Error message translations
const ERROR_MESSAGES: Record<string, string> = {
  otp_expired:
    "Le lien a expiré. Les liens de réinitialisation sont valides pendant 1 heure.",
  access_denied: "Accès refusé. Le lien est invalide ou a expiré.",
  invalid_request: "Requête invalide. Veuillez réessayer.",
  "Email link is invalid or has expired":
    "Le lien a expiré. Les liens de réinitialisation sont valides pendant 1 heure.",
};

function getErrorMessage(error: string, errorCode?: string): string {
  // Check error code first
  if (errorCode && ERROR_MESSAGES[errorCode]) {
    return ERROR_MESSAGES[errorCode];
  }
  // Check error message
  if (ERROR_MESSAGES[error]) {
    return ERROR_MESSAGES[error];
  }
  // Return decoded error or default message
  return (
    decodeURIComponent(error.replace(/\+/g, " ")) || "Une erreur est survenue."
  );
}

export default function AuthCallbackScreen() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const [isExpiredLink, setIsExpiredLink] = useState(false);
  const params = useLocalSearchParams();

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      // Get parameters from URL - check both query params and hash fragments
      let accessToken = params.access_token as string;
      let refreshToken = params.refresh_token as string;
      let type = params.type as string;
      let error = params.error as string;
      let errorCode = params.error_code as string;
      let errorDescription = params.error_description as string;
      let code = params.code as string;
      let tokenHash = params.token_hash as string;

      // On web, Supabase sends tokens in URL hash fragments or uses PKCE with code/token_hash
      if (Platform.OS === "web" && typeof window !== "undefined") {
        const hash = window.location.hash;
        if (hash) {
          const hashParams = new URLSearchParams(hash.substring(1));
          accessToken = accessToken || hashParams.get("access_token") || "";
          refreshToken = refreshToken || hashParams.get("refresh_token") || "";
          type = type || hashParams.get("type") || "";
          error = error || hashParams.get("error") || "";
          errorCode = errorCode || hashParams.get("error_code") || "";
          errorDescription =
            errorDescription || hashParams.get("error_description") || "";
        }

        // Also check URL search params (PKCE flow uses query params)
        const searchParams = new URLSearchParams(window.location.search);
        accessToken = accessToken || searchParams.get("access_token") || "";
        refreshToken = refreshToken || searchParams.get("refresh_token") || "";
        type = type || searchParams.get("type") || "";
        error = error || searchParams.get("error") || "";
        errorCode = errorCode || searchParams.get("error_code") || "";
        errorDescription =
          errorDescription || searchParams.get("error_description") || "";
        code = code || searchParams.get("code") || "";
        tokenHash = tokenHash || searchParams.get("token_hash") || "";
      }

      console.log("[Auth Callback] Params:", {
        type,
        hasCode: !!code,
        hasTokenHash: !!tokenHash,
        error,
      });

      // Check for error in URL
      if (error || errorDescription || errorCode) {
        const isExpired =
          errorCode === "otp_expired" ||
          errorDescription?.includes("expired") ||
          error === "access_denied";
        // If it's an "expired" error but we actually have a session (user is logged in),
        // it means they clicked the link again. We should just redirect them.
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session && isExpired) {
          console.log(
            "[Auth Callback] Session exists despite error, treating as success",
          );

          // Check if it was a recovery flow
          const isRecovery =
            type === "recovery" || type === "password_recovery";

          if (isRecovery) {
            setStatus("success");
            setMessage("Vous êtes déjà connecté via un lien de récupération.");
            setTimeout(() => {
              router.replace("/(auth)/change-password");
            }, 1000);
            return;
          }

          setStatus("success");
          setMessage("Vous êtes déjà connecté.");
          setTimeout(() => {
            router.replace("/(tabs)");
          }, 1500);
          return;
        }

        setIsExpiredLink(isExpired);
        setStatus("error");
        setMessage(
          getErrorMessage(errorDescription || error || errorCode, errorCode),
        );
        return;
      }

      // Handle PKCE token_hash (New Recommended Flow)
      if (tokenHash && type) {
        console.log("[Auth Callback] Verifying token_hash...");
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as any,
        });

        if (verifyError) {
          console.error(
            "[Auth Callback] Token verification failed:",
            verifyError.message,
          );

          // Check if we already have a session (e.g. user double-clicked the link)
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session) {
            console.log(
              "[Auth Callback] Session exists despite verify error, treating as success",
            );

            // Check if it was a recovery flow
            const isRecovery =
              type === "recovery" || type === "password_recovery";

            if (isRecovery) {
              setStatus("success");
              setMessage(
                "Vous êtes déjà connecté via un lien de récupération.",
              );
              setTimeout(() => {
                router.replace("/(auth)/change-password");
              }, 1000);
              return;
            }

            setStatus("success");
            setMessage("Vous êtes déjà connecté.");
            setTimeout(() => {
              router.replace("/(tabs)");
            }, 1500);
            return;
          }

          const isExpired =
            verifyError.message?.includes("expired") ||
            verifyError.message?.includes("invalid");
          setIsExpiredLink(isExpired);
          setStatus("error");
          setMessage(getErrorMessage(verifyError.message));
          return;
        }
        console.log("[Auth Callback] Token verified successfully");
      }

      // PKCE Flow: If we have a code, we need to exchange it for a session
      // This is required when detectSessionInUrl is false
      else if (code) {
        console.log("[Auth Callback] Exchanging PKCE code for session...");
        const { data: exchangeData, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error(
            "[Auth Callback] Code exchange failed:",
            exchangeError.message,
          );

          // Check for existing session
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session) {
            console.log(
              "[Auth Callback] Session exists despite code exchange error, treating as success",
            );

            // Check if it was a recovery flow
            const isRecovery =
              type === "recovery" || type === "password_recovery";

            if (isRecovery) {
              setStatus("success");
              setMessage(
                "Vous êtes déjà connecté via un lien de récupération.",
              );
              setTimeout(() => {
                router.replace("/(auth)/change-password");
              }, 1000);
              return;
            }

            setStatus("success");
            setMessage("Vous êtes déjà connecté.");
            setTimeout(() => {
              router.replace("/(tabs)");
            }, 1500);
            return;
          }

          const isExpired =
            exchangeError.message?.includes("expired") ||
            exchangeError.message?.includes("invalid");
          setIsExpiredLink(isExpired);
          setStatus("error");
          setMessage(getErrorMessage(exchangeError.message));
          return;
        }

        console.log(
          "[Auth Callback] Code exchange successful, session established",
        );
      }

      // If we have tokens directly in the URL (implicit flow), set the session manually
      else if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          const isExpired = sessionError.message?.includes("expired");
          setIsExpiredLink(isExpired);
          setStatus("error");
          setMessage(getErrorMessage(sessionError.message));
          return;
        }
      }

      // Get the current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        setStatus("error");
        setMessage(getErrorMessage(sessionError.message));
        return;
      }

      if (!session) {
        // No session - something went wrong
        setStatus("error");
        setMessage("Session non trouvée. Le lien a peut-être expiré.");
        setIsExpiredLink(true);
        return;
      }

      // Determine if this is a password recovery flow
      // With PKCE, we check the session's AMR (Authentication Methods Reference) claims
      // or the recovery_sent_at timestamp on the user object
      const userAny = session.user as any;
      const isRecovery =
        type === "recovery" ||
        type === "password_recovery" ||
        // Check AMR claims for recovery method (only 'recovery', not 'otp' to avoid false positives)
        userAny?.amr?.some((a: any) => a.method === "recovery") ||
        // Check if recovery was recently sent (within recovery window)
        (userAny?.recovery_sent_at &&
          new Date(userAny.recovery_sent_at).getTime() >
            Date.now() - RECOVERY_WINDOW_MS) ||
        // Check user_metadata or app_metadata for recovery flag
        userAny?.user_metadata?.recovery_flow === true;

      console.log("[Auth Callback] Is recovery flow:", isRecovery, {
        type,
        amr: userAny?.amr,
        recovery_sent_at: userAny?.recovery_sent_at,
      });

      if (isRecovery) {
        setStatus("success");
        setMessage("Vous pouvez maintenant changer votre mot de passe.");
        setTimeout(() => {
          router.replace("/(auth)/change-password");
        }, 1000);
        return;
      }

      // Email verification or regular sign-in success
      setStatus("success");
      setMessage("Connexion réussie ! Redirection...");
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 1500);
    } catch (error: any) {
      console.error("Auth callback error:", error);
      setStatus("error");
      setMessage(
        error?.message || "Une erreur est survenue lors de la vérification.",
      );
    }
  };

  const handleResendLink = () => {
    router.replace("/(auth)/forgot-password");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
        }}
      >
        {status === "loading" && (
          <FadeInView animation="scale">
            <View style={{ alignItems: "center" }}>
              <ActivityIndicator size="large" color="#09B2AD" />
              <Text
                style={{
                  marginTop: 24,
                  fontSize: 18,
                  color: BRAND_THEME.colors.gray[600],
                  textAlign: "center",
                }}
              >
                Vérification en cours...
              </Text>
            </View>
          </FadeInView>
        )}

        {status === "success" && (
          <FadeInView animation="scale">
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  backgroundColor: "rgba(9, 178, 173, 0.1)",
                  borderRadius: 50,
                  padding: 24,
                  marginBottom: 24,
                }}
              >
                <Text style={{ fontSize: 56 }}>✅</Text>
              </View>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: BRAND_THEME.colors.gray[900],
                  marginBottom: 12,
                  textAlign: "center",
                }}
              >
                Succès !
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: BRAND_THEME.colors.gray[500],
                  textAlign: "center",
                }}
              >
                {message}
              </Text>
            </View>
          </FadeInView>
        )}

        {status === "error" && (
          <FadeInView animation="scale">
            <View
              style={{ alignItems: "center", width: "100%", maxWidth: 400 }}
            >
              <View
                style={{
                  backgroundColor: "rgba(220, 38, 38, 0.1)",
                  borderRadius: 50,
                  padding: 24,
                  marginBottom: 24,
                }}
              >
                <Text style={{ fontSize: 56 }}>⏰</Text>
              </View>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: BRAND_THEME.colors.gray[900],
                  marginBottom: 12,
                  textAlign: "center",
                }}
              >
                {isExpiredLink ? "Lien expiré" : "Erreur"}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: BRAND_THEME.colors.gray[500],
                  textAlign: "center",
                  marginBottom: 32,
                  lineHeight: 24,
                }}
              >
                {message}
              </Text>

              {isExpiredLink && (
                <View style={{ width: "100%", marginBottom: 16 }}>
                  <AnimatedButton
                    title="🔄 Demander un nouveau lien"
                    onPress={handleResendLink}
                    variant="primary"
                    size="lg"
                  />
                </View>
              )}

              <TouchableOpacity
                onPress={() => router.replace("/(auth)/login")}
                style={{ paddingVertical: 12 }}
              >
                <Text
                  style={{
                    color: BRAND_THEME.colors.gray[500],
                    fontSize: 15,
                    textDecorationLine: "underline",
                  }}
                >
                  Retour à la connexion
                </Text>
              </TouchableOpacity>
            </View>
          </FadeInView>
        )}
      </View>
    </SafeAreaView>
  );
}
