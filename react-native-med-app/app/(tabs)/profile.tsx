// ============================================================================
// Profile Screen - Premium UI with Dark Mode Support
// ============================================================================

import { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Alert,
  Animated,
  Pressable,
  Platform,
  useWindowDimensions,
  Switch,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  LayoutAnimation,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useTheme, ThemeColors } from "@/context/ThemeContext";
import { getUserStatistics, getAllModuleStatistics } from "@/lib/stats";
import { UserStatistics, ModuleStatistics, DeviceSession } from "@/types";
import { YEARS } from "@/constants";
import { Badge, FadeInView, Skeleton } from "@/components/ui";
import { WebHeader } from "@/components/ui/WebHeader";
import {
  SavesIcon,
  CorrectIcon,
  FalseIcon,
  FileIcon,
  GoalIcon,
  BookIcon,
  ClockIcon,
} from "@/components/icons/ResultIcons";
import { showConfirm } from "@/lib/alerts";
import { supabase } from "@/lib/supabase";
import { OfflineContentService, OfflineVersion } from "@/lib/offline-content";
import { getUserActivationCode } from "@/lib/auth";

// Use native driver only on native platforms, not on web
const USE_NATIVE_DRIVER = Platform.OS !== "web";

export default function ProfileScreen() {
  const { user, signOut, getDeviceSessions } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const { width } = useWindowDimensions();

  const isWeb = Platform.OS === "web";
  const isDesktop = width >= 1024;
  const showWebHeader = isWeb && width >= 768;
  const contentMaxWidth = isDesktop ? 1000 : 800;

  const [stats, setStats] = useState<UserStatistics | null>(null);
  const [moduleStats, setModuleStats] = useState<ModuleStatistics[]>([]);
  const [deviceSessions, setDeviceSessions] = useState<DeviceSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState<
    "general" | "bug" | "feature" | "content"
  >("general");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Expanded card state
  const [isExpanded, setIsExpanded] = useState(false);
  const [activationCode, setActivationCode] = useState<string | null>(null);
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [showCode, setShowCode] = useState(false);

  // Offline content state
  const [offlineStatus, setOfflineStatus] = useState<{
    downloaded: boolean;
    version: string | null;
    updateAvailable: boolean;
    questionCount: number;
    moduleCount: number;
  }>({
    downloaded: false,
    version: null,
    updateAvailable: false,
    questionCount: 0,
    moduleCount: 0,
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Offline Manager State
  const [showOfflineManager, setShowOfflineManager] = useState(false);
  const [offlineModules, setOfflineModules] = useState<any[]>([]);
  const [storageUsage, setStorageUsage] = useState(0);
  const [loadingManager, setLoadingManager] = useState(false);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-15)).current;

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [userStats, modStats, sessions] = await Promise.all([
        getUserStatistics(user.id),
        getAllModuleStatistics(user.id),
        getDeviceSessions(),
      ]);
      if (!userStats.error) setStats(userStats.stats);
      if (!modStats.error) setModuleStats(modStats.stats);
      if (!sessions.error) setDeviceSessions(sessions.sessions);
    } catch {
      // Error loading profile data
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user, getDeviceSessions]);

  useEffect(() => {
    loadData();
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.spring(headerSlide, {
        toValue: 0,
        friction: 8,
        tension: 60,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  }, [loadData]);

  useEffect(() => {
    if (!user && !isLoading) {
      router.replace("/(auth)/welcome");
    }
  }, [user, isLoading]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    // Also refresh offline status on pull-to-refresh
    if (Platform.OS !== "web") {
      checkOfflineStatus();
    }
  }, [loadData]);

  // Check offline content status (local cache + remote version)
  const checkOfflineStatus = useCallback(async () => {
    if (Platform.OS === "web") return;

    try {
      const localVersion = await OfflineContentService.getLocalVersion();
      const { hasUpdate, remoteVersion } =
        await OfflineContentService.checkForUpdates();

      setOfflineStatus({
        downloaded: !!localVersion,
        version: localVersion?.version || null,
        updateAvailable: hasUpdate,
        questionCount:
          localVersion?.total_questions || remoteVersion?.total_questions || 0,
        moduleCount:
          localVersion?.total_modules || remoteVersion?.total_modules || 0,
      });
    } catch (error) {
      // Silent fail - offline status check is not critical
      if (__DEV__) {
        console.warn("[Profile] Offline status check failed:", error);
      }
    }
  }, []);

  // Handle download/update of offline content
  const handleDownloadOffline = async () => {
    if (isDownloading || isDeleting) return;

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      await OfflineContentService.downloadUpdates((progress: number) => {
        setDownloadProgress(progress);
      });

      // Refresh status after download
      await checkOfflineStatus();

      Alert.alert(
        "✅ Téléchargement terminé",
        "Le contenu est maintenant disponible hors-ligne.",
        [{ text: "OK" }],
      );
    } catch (error) {
      Alert.alert(
        "Erreur",
        "Le téléchargement a échoué. Vérifiez votre connexion et réessayez.",
        [{ text: "OK" }],
      );
      if (__DEV__) {
        console.error("[Profile] Download failed:", error);
      }
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handleDeleteOffline = () => {
    if (isDownloading || isDeleting) return;

    Alert.alert(
      "Supprimer le contenu ?",
      "Attention : Vous allez supprimer tout le contenu hors-ligne. Vous ne pourrez plus étudier sans internet jusqu'au prochain téléchargement.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              const success = await OfflineContentService.clearOfflineData();
              if (success) {
                setOfflineStatus({
                  downloaded: false,
                  version: null,
                  updateAvailable: false,
                  questionCount: 0,
                  moduleCount: 0,
                });
                Alert.alert("Succès", "Contenu hors-ligne supprimé.");
              } else {
                Alert.alert("Erreur", "Impossible de supprimer le contenu.");
              }
            } catch (error) {
              Alert.alert("Erreur", "Une erreur est survenue.");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  // Toggle profile expansion
  const toggleExpand = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);

    // Fetch activation code if expanding and not yet loaded
    if (!isExpanded && !activationCode && !isLoadingCode && user) {
      setIsLoadingCode(true);
      try {
        const { code } = await getUserActivationCode(user.id);
        setActivationCode(code);
      } catch (e) {
        console.error("Error fetching code", e);
      } finally {
        setIsLoadingCode(false);
      }
    }
  };

  // Check offline status on mount (only on mobile)
  useEffect(() => {
    if (Platform.OS !== "web") {
      checkOfflineStatus();
    }
  }, [checkOfflineStatus]);

  const handleSignOut = () => {
    showConfirm(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      async () => {
        try {
          const result = await signOut();
          if (result?.error) Alert.alert("Erreur", result.error);
        } catch {
          Alert.alert("Erreur", "Une erreur est survenue");
        }
      },
      "Déconnexion",
      "Annuler",
      "destructive",
    );
  };

  // Open Offline Manager
  const openOfflineManager = async () => {
    setShowOfflineManager(true);
    setLoadingManager(true);
    try {
      const [modules, usage] = await Promise.all([
        OfflineContentService.getAllModules(),
        OfflineContentService.getOfflineStorageUsage(),
      ]);
      setOfflineModules(modules);
      setStorageUsage(usage);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingManager(false);
    }
  };

  // Delete specific module from manager
  const handleDeleteModule = async (moduleName: string) => {
    Alert.alert(
      "Supprimer le module ?",
      `Voulez-vous supprimer "${moduleName}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setLoadingManager(true);
            try {
              const success =
                await OfflineContentService.deleteModule(moduleName);
              if (success) {
                // Refresh data
                const [modules, usage] = await Promise.all([
                  OfflineContentService.getAllModules(),
                  OfflineContentService.getOfflineStorageUsage(),
                ]);

                if (modules.length === 0) {
                  // If empty, close manager and reset status
                  setShowOfflineManager(false);
                  setOfflineStatus({
                    downloaded: false,
                    version: null,
                    updateAvailable: false,
                    questionCount: 0,
                    moduleCount: 0,
                  });
                } else {
                  setOfflineModules(modules);
                  setStorageUsage(usage);
                  // Update global status counts
                  const newCount = modules.reduce(
                    (sum, m) => sum + (m.question_count || 0),
                    0,
                  );
                  setOfflineStatus((prev) => ({
                    ...prev,
                    questionCount: newCount,
                    moduleCount: modules.length,
                  }));
                }
              }
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer le module");
            } finally {
              setLoadingManager(false);
            }
          },
        },
      ],
    );
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim()) {
      Alert.alert("Erreur", "Veuillez entrer votre message");
      return;
    }

    setSubmittingFeedback(true);
    try {
      const { error } = await supabase.from("user_feedback").insert({
        user_id: user?.id,
        user_email: user?.email,
        user_name: user?.full_name,
        feedback_type: feedbackType,
        message: feedbackMessage.trim(),
        rating: feedbackRating > 0 ? feedbackRating : null,
      });

      if (error) throw error;

      Alert.alert("Merci !", "Votre feedback a été envoyé avec succès.");
      setShowFeedbackModal(false);
      setFeedbackMessage("");
      setFeedbackType("general");
      setFeedbackRating(0);
    } catch (err) {
      Alert.alert(
        "Erreur",
        "Impossible d'envoyer le feedback. Réessayez plus tard.",
      );
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const getYearLabel = () =>
    YEARS.find((y) => y.value === user?.year_of_study)?.label || "";

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Jamais";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getSubscriptionStatus = () => {
    if (!user?.is_paid) return { label: "Non actif", color: "error" };
    if (!user.subscription_expires_at)
      return { label: "Actif", color: "success" };
    const expiryDate = new Date(user.subscription_expires_at);
    const now = new Date();
    if (expiryDate < now) return { label: "Expiré", color: "error" };
    const daysLeft = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysLeft <= 7)
      return { label: `Expire dans ${daysLeft}j`, color: "warning" };
    return { label: "Actif", color: "success" };
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        {showWebHeader && <WebHeader />}
        <ProfileSkeleton isDesktop={isDesktop} colors={colors} />
      </SafeAreaView>
    );
  }

  const subscriptionStatus = getSubscriptionStatus();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={showWebHeader ? ["bottom"] : ["top", "bottom"]}
    >
      {showWebHeader && <WebHeader />}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ alignItems: "center" }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View
          style={{
            width: "100%",
            maxWidth: contentMaxWidth,
            paddingHorizontal: isDesktop ? 32 : 24,
          }}
        >
          {/* Profile Header */}
          <Pressable onPress={toggleExpand}>
            <Animated.View
              style={{
                backgroundColor: colors.card,
                borderRadius: isDesktop ? 28 : 20,
                padding: isDesktop ? 32 : 24,
                marginTop: isDesktop ? 32 : 16,
                opacity: headerOpacity,
                transform: [{ translateY: headerSlide }],
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.3 : 0.1,
                shadowRadius: 4,
                elevation: 3,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View
                style={{
                  flexDirection: isDesktop ? "row" : "column",
                  alignItems: isDesktop ? "center" : "flex-start",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                    marginBottom: isDesktop ? 0 : 20,
                  }}
                >
                  <View
                    style={{
                      width: isDesktop ? 80 : 64,
                      height: isDesktop ? 80 : 64,
                      backgroundColor: colors.primary,
                      borderRadius: isDesktop ? 24 : 20,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 20,
                    }}
                  >
                    <Text
                      style={{
                        color: "#ffffff",
                        fontSize: isDesktop ? 32 : 26,
                        fontWeight: "700",
                      }}
                    >
                      {user?.full_name?.charAt(0)?.toUpperCase() || "👤"}
                    </Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={{
                        fontSize: isDesktop ? 28 : 24,
                        fontWeight: "800",
                        color: colors.text,
                        marginBottom: 6,
                      }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {user?.full_name || "Utilisateur"}
                    </Text>
                    <Text
                      style={{
                        color: colors.textMuted,
                        fontSize: isDesktop ? 16 : 14,
                        flexShrink: 1,
                      }}
                      numberOfLines={1}
                      ellipsizeMode="middle"
                    >
                      {user?.email}
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    flexWrap: "wrap",
                    marginLeft: isDesktop ? 20 : 0,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: colors.primaryMuted,
                      borderRadius: 20,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.primary,
                        fontWeight: "600",
                        fontSize: 14,
                      }}
                    >
                      📚 {getYearLabel()}
                    </Text>
                  </View>
                  {user?.speciality && (
                    <View
                      style={{
                        backgroundColor: colors.backgroundSecondary,
                        borderRadius: 20,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontWeight: "600",
                          fontSize: 14,
                        }}
                      >
                        {" "}
                        {user.speciality}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Expanded Details */}
              {isExpanded && (
                <View
                  style={{
                    marginTop: 24,
                    paddingTop: 24,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                  }}
                >
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 20 }}
                  >
                    {/* Region */}
                    {user?.region && (
                      <View style={{ width: "45%" }}>
                        <Text
                          style={{
                            color: colors.textMuted,
                            fontSize: 12,
                            marginBottom: 4,
                          }}
                        >
                          Région
                        </Text>
                        <Text
                          style={{
                            color: colors.text,
                            fontSize: 16,
                            fontWeight: "600",
                          }}
                        >
                          {user.region}
                        </Text>
                      </View>
                    )}
                    {/* Faculty */}
                    {user?.faculty && (
                      <View style={{ width: "45%" }}>
                        <Text
                          style={{
                            color: colors.textMuted,
                            fontSize: 12,
                            marginBottom: 4,
                          }}
                        >
                          Faculté
                        </Text>
                        <Text
                          style={{
                            color: colors.text,
                            fontSize: 16,
                            fontWeight: "600",
                          }}
                        >
                          {user.faculty}
                        </Text>
                      </View>
                    )}
                    {/* Member Since */}
                    <View style={{ width: "45%" }}>
                      <Text
                        style={{
                          color: colors.textMuted,
                          fontSize: 12,
                          marginBottom: 4,
                        }}
                      >
                        Membre depuis
                      </Text>
                      <Text
                        style={{
                          color: colors.text,
                          fontSize: 16,
                          fontWeight: "600",
                        }}
                      >
                        {formatDate(user?.created_at || null)}
                      </Text>
                    </View>
                    {/* Activation Code */}
                    <View style={{ width: "100%", marginTop: 8 }}>
                      <Text
                        style={{
                          color: colors.textMuted,
                          fontSize: 12,
                          marginBottom: 8,
                        }}
                      >
                        Code d'activation
                      </Text>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          setShowCode(!showCode);
                        }}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: colors.backgroundSecondary,
                          padding: 12,
                          borderRadius: 12,
                          alignSelf: "flex-start",
                        }}
                      >
                        {isLoadingCode ? (
                          <ActivityIndicator
                            size="small"
                            color={colors.primary}
                          />
                        ) : (
                          <>
                            <Text
                              style={{
                                color: colors.text,
                                fontSize: 16,
                                fontWeight: "700",
                                letterSpacing: 2,
                                marginRight: 10,
                                fontFamily:
                                  Platform.OS === "ios"
                                    ? "Courier"
                                    : "monospace",
                              }}
                            >
                              {activationCode
                                ? showCode
                                  ? activationCode
                                  : "••••••••••••"
                                : "Aucun code"}
                            </Text>
                            {activationCode && (
                              <Text
                                style={{
                                  fontSize: 16,
                                  color: colors.textMuted,
                                }}
                              >
                                {showCode ? "👁️‍🗨️" : "👁️"}
                              </Text>
                            )}
                          </>
                        )}
                      </Pressable>
                    </View>
                  </View>
                </View>
              )}
            </Animated.View>
          </Pressable>

          {/* Dark Mode Toggle */}
          <FadeInView delay={50} animation="slideUp">
            <View style={{ marginTop: 20 }}>
              <ThemedCard colors={colors} isDark={isDark}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                      style={{
                        width: 52,
                        height: 52,
                        backgroundColor: isDark
                          ? "rgba(251, 191, 36, 0.15)"
                          : "rgba(99, 102, 241, 0.1)",
                        borderRadius: 16,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 16,
                      }}
                    >
                      <Text style={{ fontSize: 26 }}>
                        {isDark ? "🌙" : "☀️"}
                      </Text>
                    </View>
                    <View>
                      <Text
                        style={{
                          fontSize: 17,
                          fontWeight: "700",
                          color: colors.text,
                        }}
                      >
                        Mode sombre
                      </Text>
                      <Text
                        style={{
                          color: colors.textMuted,
                          fontSize: 14,
                          marginTop: 2,
                        }}
                      >
                        {isDark ? "Activé" : "Désactivé"}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={isDark}
                    onValueChange={toggleTheme}
                    trackColor={{
                      false: colors.border,
                      true: colors.primaryLight,
                    }}
                    thumbColor={isDark ? colors.primary : "#f4f3f4"}
                    ios_backgroundColor={colors.border}
                  />
                </View>
              </ThemedCard>
            </View>
          </FadeInView>

          {/* Offline Content - Only on mobile */}
          {Platform.OS !== "web" && (
            <FadeInView delay={60} animation="slideUp">
              <Pressable
                onPress={
                  offlineStatus.downloaded &&
                  !offlineStatus.updateAvailable &&
                  !isDownloading
                    ? openOfflineManager
                    : handleDownloadOffline
                }
                disabled={isDownloading}
              >
                <ThemedCard
                  colors={colors}
                  isDark={isDark}
                  style={{ marginTop: 16 }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        flex: 1,
                      }}
                    >
                      <View
                        style={{
                          width: 52,
                          height: 52,
                          backgroundColor: offlineStatus.downloaded
                            ? "rgba(16, 185, 129, 0.1)"
                            : "rgba(99, 102, 241, 0.1)",
                          borderRadius: 16,
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 16,
                        }}
                      >
                        <Text style={{ fontSize: 26 }}>
                          {isDownloading
                            ? "⏳"
                            : offlineStatus.downloaded
                              ? "✅"
                              : "📥"}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 17,
                              fontWeight: "700",
                              color: colors.text,
                            }}
                          >
                            Mode hors-ligne
                          </Text>
                          {offlineStatus.updateAvailable && !isDownloading && (
                            <View
                              style={{
                                backgroundColor: colors.warning || "#f59e0b",
                                borderRadius: 10,
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                              }}
                            >
                              <Text
                                style={{
                                  color: "#fff",
                                  fontSize: 10,
                                  fontWeight: "700",
                                }}
                              >
                                MAJ
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text
                          style={{
                            color: colors.textMuted,
                            fontSize: 14,
                            marginTop: 2,
                          }}
                        >
                          {isDownloading
                            ? `Téléchargement... ${Math.round(downloadProgress * 100)}%`
                            : offlineStatus.downloaded
                              ? `${offlineStatus.questionCount} questions • v${offlineStatus.version}`
                              : "Télécharger pour utiliser sans internet"}
                        </Text>
                      </View>
                    </View>
                    {/* Right Side Actions */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      {/* Updates or Action Arrow */}
                      {!isDownloading &&
                        !isDeleting &&
                        (!offlineStatus.downloaded ||
                          offlineStatus.updateAvailable) && (
                          <Text style={{ fontSize: 20, color: colors.primary }}>
                            →
                          </Text>
                        )}

                      {/* Manage Button (Settings Icon) */}
                      {!isDownloading &&
                        !isDeleting &&
                        offlineStatus.downloaded && (
                          <View style={{ flexDirection: "row", gap: 8 }}>
                            {offlineStatus.updateAvailable && (
                              <TouchableOpacity
                                onPress={handleDownloadOffline}
                                style={{ padding: 4 }}
                              >
                                <Text style={{ fontSize: 20 }}>🔄</Text>
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation();
                                openOfflineManager();
                              }}
                              style={{
                                padding: 8,
                                backgroundColor: colors.backgroundSecondary,
                                borderRadius: 12,
                              }}
                            >
                              <Text style={{ fontSize: 16 }}>⚙️</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                    </View>
                  </View>

                  {/* Progress bar during download */}
                  {isDownloading && (
                    <View
                      style={{
                        marginTop: 12,
                        height: 6,
                        backgroundColor: colors.backgroundSecondary,
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          width: `${downloadProgress * 100}%`,
                          height: "100%",
                          backgroundColor: colors.primary,
                          borderRadius: 3,
                        }}
                      />
                    </View>
                  )}
                </ThemedCard>
              </Pressable>
            </FadeInView>
          )}

          {/* Feedback Button */}
          <FadeInView delay={75} animation="slideUp">
            <Pressable onPress={() => setShowFeedbackModal(true)}>
              <ThemedCard
                colors={colors}
                isDark={isDark}
                style={{ marginTop: 16 }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                      style={{
                        width: 52,
                        height: 52,
                        backgroundColor: "rgba(16, 185, 129, 0.1)",
                        borderRadius: 16,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 16,
                      }}
                    >
                      <Text style={{ fontSize: 26 }}>💬</Text>
                    </View>
                    <View>
                      <Text
                        style={{
                          fontSize: 17,
                          fontWeight: "700",
                          color: colors.text,
                        }}
                      >
                        Feedback
                      </Text>
                      <Text
                        style={{
                          color: colors.textMuted,
                          fontSize: 14,
                          marginTop: 2,
                        }}
                      >
                        Partagez vos suggestions
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 20, color: colors.primary }}>→</Text>
                </View>
              </ThemedCard>
            </Pressable>
          </FadeInView>

          {/* Grid Layout */}
          <View
            style={{
              flexDirection: isDesktop ? "row" : "column",
              gap: 20,
              marginTop: 24,
            }}
          >
            {/* Left Column */}
            <View style={{ flex: isDesktop ? 1 : undefined }}>
              {/* Subscription */}
              <FadeInView delay={100} animation="slideUp">
                <ThemedCard colors={colors} isDark={isDark}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View>
                      <Text
                        style={{
                          color: colors.textMuted,
                          fontSize: 13,
                          marginBottom: 6,
                          fontWeight: "500",
                        }}
                      >
                        Abonnement
                      </Text>
                      <Badge
                        label={subscriptionStatus.label}
                        variant={subscriptionStatus.color as any}
                      />
                    </View>
                    {user?.subscription_expires_at && (
                      <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                        Expire le {formatDate(user.subscription_expires_at)}
                      </Text>
                    )}
                  </View>
                </ThemedCard>
              </FadeInView>

              {/* Saved Questions */}
              <FadeInView delay={200} animation="slideUp">
                <Pressable onPress={() => router.push("/saved")}>
                  <ThemedCard
                    colors={colors}
                    isDark={isDark}
                    style={{ marginTop: 16 }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <View
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: 16,
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 16,
                          }}
                        >
                          <SavesIcon size={26} color={colors.text} />
                        </View>
                        <View>
                          <Text
                            style={{
                              fontSize: 17,
                              fontWeight: "700",
                              color: colors.text,
                            }}
                          >
                            Questions sauvegardées
                          </Text>
                          <Text
                            style={{
                              color: colors.textMuted,
                              fontSize: 14,
                              marginTop: 2,
                            }}
                          >
                            {stats?.saved_questions_count || 0} question
                            {(stats?.saved_questions_count || 0) > 1 ? "s" : ""}
                          </Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 20, color: colors.primary }}>
                        →
                      </Text>
                    </View>
                  </ThemedCard>
                </Pressable>
              </FadeInView>
              {/* Devices */}
              <FadeInView delay={300} animation="slideUp">
                <View style={{ marginTop: 24 }}>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "700",
                      color: colors.text,
                      marginBottom: 14,
                    }}
                  >
                    Appareils connectés ({deviceSessions.length}/2)
                  </Text>
                  <ThemedCard colors={colors} isDark={isDark}>
                    {deviceSessions.length === 0 ? (
                      <Text
                        style={{
                          color: colors.textMuted,
                          textAlign: "center",
                          fontStyle: "italic",
                          paddingVertical: 12,
                        }}
                      >
                        Aucun appareil connecté
                      </Text>
                    ) : (
                      <View style={{ gap: 12 }}>
                        {deviceSessions.map((session, index) => (
                          <DeviceSessionCard
                            key={session.id}
                            session={session}
                            isLast={index === deviceSessions.length - 1}
                            colors={colors}
                          />
                        ))}
                      </View>
                    )}
                    <View
                      style={{
                        marginTop: 16,
                        paddingTop: 16,
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ fontSize: 14, marginRight: 8 }}>ℹ️</Text>
                        <Text
                          style={{
                            color: colors.textMuted,
                            fontSize: 12,
                            lineHeight: 18,
                            flex: 1,
                            textAlign: "center",
                          }}
                        >
                          Vous pouvez utiliser l'application sur 2 appareils
                          maximum.
                        </Text>
                      </View>
                    </View>
                  </ThemedCard>
                </View>
              </FadeInView>
            </View>

            {/* Right Column */}
            <View style={{ flex: isDesktop ? 1 : undefined }}>
              {/* Statistics */}
              {stats && (
                <FadeInView delay={400} animation="slideUp">
                  <View style={{ marginTop: isDesktop ? 0 : 24 }}>
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: "700",
                        color: colors.text,
                        marginBottom: 14,
                      }}
                    >
                      Statistiques
                    </Text>
                    <ThemedCard colors={colors} isDark={isDark}>
                      <View
                        style={{
                          flexDirection: "row",
                          flexWrap: "wrap",
                          marginBottom: 20,
                        }}
                      >
                        <StatBox
                          label="Total"
                          value={stats.total_questions_attempted}
                          icon={<FileIcon size={26} color={colors.text} />}
                          colors={colors}
                        />
                        <StatBox
                          label="Correctes"
                          value={stats.total_correct_answers}
                          icon={
                            <CorrectIcon size={26} color={colors.success} />
                          }
                          colors={colors}
                        />
                        <StatBox
                          label="Incorrectes"
                          value={
                            stats.total_questions_attempted -
                            stats.total_correct_answers
                          }
                          icon={<FalseIcon size={26} color={colors.error} />}
                          colors={colors}
                        />
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          flexWrap: "wrap",
                          marginBottom: 16,
                        }}
                      >
                        <StatBox
                          label="Temps"
                          value={`${stats.total_time_spent_minutes}m`}
                          icon={
                            <ClockIcon
                              size={26}
                              color={isDark ? "#ffffff" : "#000000"}
                            />
                          }
                          colors={colors}
                        />
                        <StatBox
                          label="Précision"
                          value={`${Math.round(stats.average_score)}%`}
                          icon={
                            <GoalIcon
                              size={26}
                              color={isDark ? "#ffffff" : "#000000"}
                            />
                          }
                          colors={colors}
                        />
                        <StatBox
                          label="Modules"
                          value={stats.modules_practiced}
                          icon={<BookIcon size={26} color={colors.text} />}
                          colors={colors}
                        />
                      </View>
                      {stats.last_practice_date && (
                        <View
                          style={{
                            paddingTop: 16,
                            borderTopWidth: 1,
                            borderTopColor: colors.border,
                          }}
                        >
                          <Text
                            style={{
                              color: colors.textMuted,
                              fontSize: 12,
                              textAlign: "center",
                            }}
                          >
                            Dernière pratique :{" "}
                            {formatDate(stats.last_practice_date)}
                          </Text>
                        </View>
                      )}
                    </ThemedCard>
                  </View>
                </FadeInView>
              )}

              {/* Module Progress */}
              {moduleStats.length > 0 && (
                <FadeInView delay={500} animation="slideUp">
                  <View style={{ marginTop: 24 }}>
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: "700",
                        color: colors.text,
                        marginBottom: 14,
                      }}
                    >
                      Progression par module
                    </Text>
                    <View style={{ gap: 12 }}>
                      {moduleStats.slice(0, 5).map((stat, index) => (
                        <FadeInView
                          key={stat.module_name}
                          delay={550 + index * 50}
                          animation="slideUp"
                        >
                          <ModuleProgressCard
                            stat={stat}
                            colors={colors}
                            isDark={isDark}
                          />
                        </FadeInView>
                      ))}
                    </View>
                  </View>
                </FadeInView>
              )}
            </View>
          </View>

          {/* Logout */}
          <FadeInView delay={600} animation="slideUp">
            <View
              style={{
                marginTop: 40,
                maxWidth: isDesktop ? 400 : "100%",
                alignSelf: "center",
                width: "100%",
              }}
            >
              <Pressable onPress={handleSignOut}>
                <View
                  style={{
                    backgroundColor: colors.errorLight,
                    paddingVertical: 18,
                    borderRadius: 18,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: isDark
                      ? "rgba(248, 113, 113, 0.3)"
                      : "#FECACA",
                    flexDirection: "row",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 20, marginRight: 10 }}>🚪</Text>
                  <Text
                    style={{
                      color: colors.error,
                      fontSize: 16,
                      fontWeight: "600",
                    }}
                  >
                    Se déconnecter
                  </Text>
                </View>
              </Pressable>
            </View>
          </FadeInView>

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                backgroundColor: colors.card,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 24,
                maxHeight: "90%",
              }}
            >
              {/* Header */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "700",
                    color: colors.text,
                  }}
                >
                  💬 Feedback
                </Text>
                <TouchableOpacity onPress={() => setShowFeedbackModal(false)}>
                  <Text style={{ fontSize: 28, color: colors.textMuted }}>
                    ×
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Feedback Type */}
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.textSecondary,
                  marginBottom: 10,
                }}
              >
                Type de feedback
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                {[
                  { value: "general", label: "💭 Général" },
                  { value: "bug", label: "🐛 Bug" },
                  { value: "feature", label: "✨ Suggestion" },
                  { value: "content", label: "📚 Contenu" },
                ].map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    onPress={() => setFeedbackType(type.value as any)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor:
                        feedbackType === type.value
                          ? colors.primary
                          : colors.backgroundSecondary,
                      borderWidth: 1,
                      borderColor:
                        feedbackType === type.value
                          ? colors.primary
                          : colors.border,
                    }}
                  >
                    <Text
                      style={{
                        color:
                          feedbackType === type.value ? "#fff" : colors.text,
                        fontWeight: "600",
                        fontSize: 13,
                      }}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Rating */}
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.textSecondary,
                  marginBottom: 10,
                }}
              >
                Note (optionnel)
              </Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() =>
                      setFeedbackRating(feedbackRating === star ? 0 : star)
                    }
                  >
                    <Text style={{ fontSize: 28 }}>
                      {star <= feedbackRating ? "⭐" : "☆"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Message */}
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.textSecondary,
                  marginBottom: 10,
                }}
              >
                Votre message
              </Text>
              <TextInput
                value={feedbackMessage}
                onChangeText={setFeedbackMessage}
                placeholder="Décrivez votre feedback, suggestion ou problème..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={5}
                style={{
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: 16,
                  padding: 16,
                  color: colors.text,
                  fontSize: 15,
                  minHeight: 120,
                  textAlignVertical: "top",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmitFeedback}
                disabled={submittingFeedback || !feedbackMessage.trim()}
                style={{
                  backgroundColor: feedbackMessage.trim()
                    ? colors.primary
                    : colors.border,
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: "center",
                  marginTop: 20,
                }}
              >
                <Text
                  style={{
                    color: feedbackMessage.trim() ? "#fff" : colors.textMuted,
                    fontSize: 16,
                    fontWeight: "700",
                  }}
                >
                  {submittingFeedback
                    ? "Envoi en cours..."
                    : "Envoyer le feedback"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Offline Manager Modal */}
      <Modal
        visible={showOfflineManager}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowOfflineManager(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Modal Header */}
          <View
            style={{
              padding: 20,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View>
              <Text
                style={{ fontSize: 20, fontWeight: "700", color: colors.text }}
              >
                Contenu hors-ligne
              </Text>
              <Text style={{ fontSize: 13, color: colors.textMuted }}>
                Gérez votre espace de stockage
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowOfflineManager(false)}
              style={{
                padding: 8,
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 20,
              }}
            >
              <Text
                style={{ fontSize: 16, fontWeight: "600", color: colors.text }}
              >
                Fermer
              </Text>
            </TouchableOpacity>
          </View>

          {loadingManager ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              {/* Storage Stats */}
              <View style={{ padding: 24, paddingBottom: 10 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ fontWeight: "600", color: colors.text }}>
                    Espace utilisé
                  </Text>
                  <Text style={{ fontWeight: "700", color: colors.primary }}>
                    {storageUsage} MB
                  </Text>
                </View>
                <View
                  style={{
                    height: 8,
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: colors.primary,
                      opacity: 0.3,
                    }}
                  />
                  <View
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      height: "100%",
                      width:
                        `${Math.min((storageUsage / 500) * 100, 100)}%` as any,
                      backgroundColor: colors.primary,
                    }}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textMuted,
                    marginTop: 8,
                    textAlign: "right",
                  }}
                >
                  {offlineModules.length} module
                  {offlineModules.length > 1 ? "s" : ""} téléchargé
                  {offlineModules.length > 1 ? "s" : ""}
                </Text>
              </View>

              {/* Modules List */}
              <ScrollView contentContainerStyle={{ padding: 20 }}>
                {offlineModules.map((module) => (
                  <View
                    key={module.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: colors.card,
                      padding: 16,
                      borderRadius: 16,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        backgroundColor: colors.primaryMuted,
                        borderRadius: 12,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 16,
                      }}
                    >
                      <Text style={{ fontSize: 18 }}>📚</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: colors.text,
                        }}
                      >
                        {module.name}
                      </Text>
                      <Text style={{ fontSize: 13, color: colors.textMuted }}>
                        {module.year}ème année • {module.question_count} qst
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteModule(module.name)}
                      style={{ padding: 10 }}
                    >
                      <Text style={{ fontSize: 18 }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>

              {/* Footer Actions */}
              <View
                style={{
                  padding: 20,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    setShowOfflineManager(false);
                    setTimeout(() => handleDeleteOffline(), 300); // Call the main delete function
                  }}
                  style={{
                    backgroundColor: colors.errorLight,
                    paddingVertical: 16,
                    borderRadius: 16,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "rgba(239, 68, 68, 0.2)",
                  }}
                >
                  <Text
                    style={{
                      color: colors.error,
                      fontWeight: "700",
                      fontSize: 16,
                    }}
                  >
                    Tout supprimer
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Themed Card Component
function ThemedCard({
  children,
  colors,
  isDark,
  style,
}: {
  children: React.ReactNode;
  colors: ThemeColors;
  isDark: boolean;
  style?: any;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: 20,
          padding: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.2 : 0.05,
          shadowRadius: 2,
          elevation: 1,
          borderWidth: 1,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// Profile Skeleton
function ProfileSkeleton({
  isDesktop,
  colors,
}: {
  isDesktop: boolean;
  colors: ThemeColors;
}) {
  return (
    <View
      style={{
        padding: isDesktop ? 32 : 24,
        maxWidth: 1000,
        alignSelf: "center",
        width: "100%",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 24,
          backgroundColor: colors.card,
          borderRadius: 20,
          padding: 24,
        }}
      >
        <Skeleton
          width={isDesktop ? 80 : 64}
          height={isDesktop ? 80 : 64}
          borderRadius={24}
          style={{ marginRight: 20 }}
        />
        <View>
          <Skeleton width={180} height={24} style={{ marginBottom: 8 }} />
          <Skeleton width={220} height={16} />
        </View>
      </View>
      <Skeleton
        width="100%"
        height={100}
        borderRadius={20}
        style={{ marginBottom: 16 }}
      />
      <Skeleton
        width="100%"
        height={140}
        borderRadius={20}
        style={{ marginBottom: 16 }}
      />
      <Skeleton width="100%" height={200} borderRadius={20} />
    </View>
  );
}

// Stat Box
function StatBox({
  label,
  value,
  icon,
  colors,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  colors: ThemeColors;
}) {
  return (
    <View style={{ width: "33.33%", alignItems: "center", paddingVertical: 8 }}>
      <View style={{ marginBottom: 6, padding: 6, borderRadius: 12 }}>
        {icon}
      </View>
      <Text
        style={{
          fontSize: 22,
          fontWeight: "800",
          color: colors.text,
          marginBottom: 2,
        }}
      >
        {value}
      </Text>
      <Text style={{ color: colors.textMuted, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

// Module Progress Card
function ModuleProgressCard({
  stat,
  colors,
  isDark,
}: {
  stat: ModuleStatistics;
  colors: ThemeColors;
  isDark: boolean;
}) {
  const progress =
    stat.questions_attempted > 0 ? Math.round(stat.average_score) : 0;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const animatedWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.2 : 0.05,
        shadowRadius: 2,
        elevation: 1,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            color: colors.text,
            fontWeight: "600",
            flex: 1,
            fontSize: 15,
          }}
          numberOfLines={1}
        >
          {stat.module_name}
        </Text>
        <Text
          style={{ color: colors.primary, fontWeight: "700", fontSize: 15 }}
        >
          {progress}%
        </Text>
      </View>
      <View
        style={{
          height: 8,
          backgroundColor: colors.backgroundSecondary,
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={{
            height: "100%",
            backgroundColor: colors.primary,
            borderRadius: 4,
            width: animatedWidth,
          }}
        />
      </View>
      <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 10 }}>
        {stat.questions_attempted} questions • {stat.attempts_count} sessions
      </Text>
    </View>
  );
}

// Device Session Card
function DeviceSessionCard({
  session,
  isLast,
  colors,
}: {
  session: DeviceSession;
  isLast: boolean;
  colors: ThemeColors;
}) {
  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );
    if (diffInHours < 1) return "À l'instant";
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Il y a ${diffInDays}j`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 8,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            backgroundColor: colors.backgroundSecondary,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 14,
          }}
        >
          <Text style={{ fontSize: 20 }}>📱</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{ color: colors.text, fontWeight: "600", marginBottom: 2 }}
            numberOfLines={1}
          >
            {session.device_name || "Appareil inconnu"}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>
            {formatLastActive(session.last_active_at)}
          </Text>
        </View>
      </View>
      {!isLast && (
        <View
          style={{
            height: 1,
            backgroundColor: colors.border,
            marginVertical: 4,
          }}
        />
      )}
    </View>
  );
}
