// ============================================================================
// Practice Screen - Premium UI with Dark Mode Support
// ============================================================================

import { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Platform,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getQuestions } from "@/lib/questions";
import { saveTestAttempt } from "@/lib/stats";
import { toggleSaveQuestion, getSavedQuestionIds } from "@/lib/saved";
import {
  submitQuestionReport,
  ReportType,
  REPORT_TYPE_LABELS,
} from "@/lib/reports";
import { QuestionWithAnswers, OptionLabel, ExamType } from "@/types";
import {
  Card,
  Badge,
  LoadingSpinner,
  Button,
  FadeInView,
  ConfirmModal,
} from "@/components/ui";
import { ChevronLeftIcon } from "@/components/icons";
import { ANIMATION_DURATION, ANIMATION_EASING } from "@/lib/animations";

// Use native driver only on native platforms, not on web
const USE_NATIVE_DRIVER = Platform.OS !== "web";

export default function PracticeScreen() {
  const {
    moduleId,
    moduleName,
    examType,
    examYear,
    subDiscipline,
    cours,
    startQuestion,
  } = useLocalSearchParams<{
    moduleId: string;
    moduleName: string;
    examType?: string;
    examYear?: string;
    subDiscipline?: string;
    cours?: string;
    startQuestion?: string;
  }>();

  const { user } = useAuth();
  const { colors, isDark } = useTheme();

  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (typeof startQuestion === "string") {
      const start = parseInt(startQuestion);
      return isNaN(start) ? 0 : Math.max(0, start - 1);
    }
    return 0;
  });
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, OptionLabel[]>
  >({});
  const [eliminatedAnswers, setEliminatedAnswers] = useState<
    Record<string, OptionLabel[]>
  >({});
  const [submittedQuestions, setSubmittedQuestions] = useState<Set<string>>(
    new Set(),
  );
  const [savedQuestions, setSavedQuestions] = useState<Set<string>>(new Set());
  const [skippedQuestions, setSkippedQuestions] = useState<Set<string>>(
    new Set(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [startTime] = useState(new Date());
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportType, setSelectedReportType] =
    useState<ReportType | null>(null);
  const [reportDescription, setReportDescription] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportedQuestions, setReportedQuestions] = useState<Set<string>>(
    new Set(),
  );
  const scrollRef = useRef<ScrollView>(null);

  const questionFade = useRef(new Animated.Value(0)).current;
  const questionSlide = useRef(new Animated.Value(20)).current;
  const saveButtonScale = useRef(new Animated.Value(1)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  const animateQuestionIn = useCallback(() => {
    questionFade.setValue(0);
    questionSlide.setValue(20);
    Animated.parallel([
      Animated.timing(questionFade, {
        toValue: 1,
        duration: ANIMATION_DURATION.normal,
        easing: ANIMATION_EASING.premium,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(questionSlide, {
        toValue: 0,
        duration: ANIMATION_DURATION.normal,
        easing: ANIMATION_EASING.premium,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  }, []);

  const animateProgress = useCallback(() => {
    if (questions.length > 0) {
      Animated.timing(progressWidth, {
        toValue: ((currentIndex + 1) / questions.length) * 100,
        duration: ANIMATION_DURATION.normal,
        easing: ANIMATION_EASING.smooth,
        useNativeDriver: false,
      }).start();
    }
  }, [currentIndex, questions.length]);

  const animateSavePress = () => {
    Animated.sequence([
      Animated.timing(saveButtonScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.spring(saveButtonScale, {
        toValue: 1,
        friction: 3,
        tension: 200,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    animateQuestionIn();
    animateProgress();
  }, [currentIndex, animateQuestionIn, animateProgress]);

  const loadQuestions = async () => {
    try {
      const filters: any = { module_name: moduleName };
      if (examType) filters.exam_type = examType;
      if (examYear) filters.exam_year = parseInt(examYear);
      if (subDiscipline) filters.sub_discipline = subDiscipline;
      if (cours) filters.cours = cours;

      const { questions: data } = await getQuestions(filters);
      setQuestions(data);

      // Fetch all saved question IDs in one call instead of N separate calls
      if (user) {
        const { ids: savedIds } = await getSavedQuestionIds(user.id);
        const questionIdSet = new Set(data.map((q) => q.id));
        const savedSet = new Set(
          savedIds.filter((id) => questionIdSet.has(id)),
        );
        setSavedQuestions(savedSet);
      }
    } catch (error) {
      if (__DEV__) {
        console.error("Error loading questions:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];
  const isSubmitted = currentQuestion
    ? submittedQuestions.has(currentQuestion.id)
    : false;
  const isSkipped = currentQuestion
    ? skippedQuestions.has(currentQuestion.id)
    : false;
  const currentAnswers = currentQuestion
    ? selectedAnswers[currentQuestion.id] || []
    : [];
  const currentEliminated = currentQuestion
    ? eliminatedAnswers[currentQuestion.id] || []
    : [];

  const toggleEliminate = (label: OptionLabel) => {
    if (isSubmitted || !currentQuestion) return;

    setEliminatedAnswers((prev) => {
      const current = prev[currentQuestion.id] || [];
      const isEliminated = current.includes(label);

      if (isEliminated) {
        // Restore option
        return {
          ...prev,
          [currentQuestion.id]: current.filter((l) => l !== label),
        };
      } else {
        // Eliminate option
        // If it was selected, deselect it
        if (currentAnswers.includes(label)) {
          setSelectedAnswers((prevSelected) => ({
            ...prevSelected,
            [currentQuestion.id]: (
              prevSelected[currentQuestion.id] || []
            ).filter((l) => l !== label),
          }));
        }
        return { ...prev, [currentQuestion.id]: [...current, label] };
      }
    });
  };

  const selectAnswer = (label: OptionLabel) => {
    if (isSubmitted || !currentQuestion) return;

    // Don't allow selecting eliminated options
    if (currentEliminated.includes(label)) return;

    setSelectedAnswers((prev) => {
      const current = prev[currentQuestion.id] || [];
      const isSelected = current.includes(label);
      if (isSelected) {
        return {
          ...prev,
          [currentQuestion.id]: current.filter((l) => l !== label),
        };
      } else {
        return { ...prev, [currentQuestion.id]: [...current, label] };
      }
    });
  };

  const submitAnswer = () => {
    if (!currentQuestion || currentAnswers.length === 0) return;
    setSubmittedQuestions((prev) => new Set([...prev, currentQuestion.id]));
  };

  const goToNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const skipQuestion = () => {
    if (!currentQuestion) return;
    // Mark as skipped
    setSkippedQuestions((prev) => new Set([...prev, currentQuestion.id]));
    // Move to next question
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const toggleSave = async () => {
    if (!user || !currentQuestion) return;
    animateSavePress();

    try {
      const { isSaved, error } = await toggleSaveQuestion(
        user.id,
        currentQuestion.id,
        {
          module_name: currentQuestion.module_name,
          exam_type: currentQuestion.exam_type,
          exam_year: currentQuestion.exam_year,
          number: currentQuestion.number,
        },
      );

      if (error) {
        if (__DEV__) {
          console.error("[Practice] Save question error:", error);
        }
        // Don't update state if there was an error
        return;
      }

      setSavedQuestions((prev) => {
        const newSet = new Set(prev);
        if (isSaved) newSet.add(currentQuestion.id);
        else newSet.delete(currentQuestion.id);
        return newSet;
      });
    } catch (e) {
      if (__DEV__) {
        console.error("[Practice] Unexpected error saving question:", e);
      }
    }
  };

  const finishPractice = () => {
    setShowEndSessionModal(true);
  };

  const handleConfirmEndSession = async () => {
    setShowEndSessionModal(false);
    await saveResults();
  };

  const handleCancelEndSession = () => {
    setShowEndSessionModal(false);
  };

  // Report handlers
  const openReportModal = () => {
    setSelectedReportType(null);
    setReportDescription("");
    setShowReportModal(true);
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setSelectedReportType(null);
    setReportDescription("");
  };

  const handleSubmitReport = async () => {
    if (!user || !currentQuestion || !selectedReportType) return;

    setReportSubmitting(true);
    const { success, error } = await submitQuestionReport(
      user.id,
      currentQuestion.id,
      selectedReportType,
      reportDescription,
    );
    setReportSubmitting(false);

    if (success) {
      setReportedQuestions((prev) => new Set([...prev, currentQuestion.id]));
      closeReportModal();
    } else {
      // Show error (could use alert or toast)
      if (error) {
        alert(error);
      }
    }
  };

  const getEndSessionMessage = () => {
    const answeredCount = submittedQuestions.size;
    const skippedCount = skippedQuestions.size;
    const unansweredCount = questions.length - answeredCount - skippedCount;

    if (answeredCount === 0) {
      return "Vous n'avez répondu à aucune question. Voulez-vous vraiment quitter ?";
    }

    let message = `Vous avez répondu à ${answeredCount}/${questions.length} questions.`;
    if (skippedCount > 0) {
      message += `\n\n${skippedCount} question${skippedCount > 1 ? "s" : ""} sautée${skippedCount > 1 ? "s" : ""}.`;
    }
    if (unansweredCount > 0) {
      message += `\n\n${unansweredCount} question${unansweredCount > 1 ? "s" : ""} non répondue${unansweredCount > 1 ? "s" : ""} sera${unansweredCount > 1 ? "ont" : ""} ignorée${unansweredCount > 1 ? "s" : ""}.`;
    }
    return message;
  };

  const saveResults = async () => {
    if (!user) return;
    let correctCount = 0;
    const answeredQuestions = questions.filter((q) =>
      submittedQuestions.has(q.id),
    );

    for (const question of answeredQuestions) {
      const userAnswers = selectedAnswers[question.id] || [];
      const correctAnswers = question.answers
        .filter((a) => a.is_correct)
        .map((a) => a.option_label);
      const isCorrect =
        userAnswers.length === correctAnswers.length &&
        userAnswers.every((a) => correctAnswers.includes(a));
      if (isCorrect) correctCount++;
    }

    const totalQuestions = answeredQuestions.length;
    const scorePercentage =
      totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    const timeSpent = Math.round(
      (new Date().getTime() - startTime.getTime()) / 1000,
    );

    if (!user.year_of_study) {
      if (__DEV__) {
        console.warn("[Practice] User year_of_study not set, skipping save");
      }
      // Still navigate to results so user isn't stuck
      router.replace({
        pathname: "/practice/results",
        params: {
          total: totalQuestions.toString(),
          correct: correctCount.toString(),
          score: scorePercentage.toFixed(1),
          time: timeSpent.toString(),
          moduleName: moduleName!,
        },
      });
      return;
    }

    await saveTestAttempt({
      user_id: user.id,
      year: user.year_of_study,
      module_name: moduleName!,
      sub_discipline: subDiscipline || undefined,
      exam_type: (examType as ExamType) || "EMD",
      total_questions: totalQuestions,
      correct_answers: correctCount,
      score_percentage: scorePercentage,
      time_spent_seconds: timeSpent,
    });

    router.replace({
      pathname: "/practice/results",
      params: {
        total: totalQuestions.toString(),
        correct: correctCount.toString(),
        score: scorePercentage.toFixed(1),
        time: timeSpent.toString(),
        moduleName: moduleName!,
      },
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <LoadingSpinner message="Chargement des questions..." />
      </SafeAreaView>
    );
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📭</Text>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: colors.text,
              marginBottom: 8,
            }}
          >
            Aucune question
          </Text>
          <Text
            style={{
              color: colors.textMuted,
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            Aucune question disponible pour cette sélection
          </Text>
          <Button
            title="Retour"
            onPress={() => router.back()}
            variant="primary"
          />
        </View>
      </SafeAreaView>
    );
  }

  const isSaved = currentQuestion
    ? savedQuestions.has(currentQuestion.id)
    : false;

  return (
    <>
      <Stack.Screen
        options={{
          title: `Questions ${currentIndex + 1}/${questions.length}`,
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: -12, padding: 8 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronLeftIcon
                size={28}
                color={colors.primary}
                strokeWidth={2.5}
              />
            </TouchableOpacity>
          ),
        }}
      />

      {/* End Session Confirmation Modal */}
      <ConfirmModal
        visible={showEndSessionModal}
        title="Terminer la session"
        message={getEndSessionMessage()}
        confirmText="Terminer"
        cancelText="Continuer"
        variant="destructive"
        icon="🏁"
        onConfirm={handleConfirmEndSession}
        onCancel={handleCancelEndSession}
      />

      {/* Report Question Modal */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="fade"
        onRequestClose={closeReportModal}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 24,
              padding: 24,
              width: "100%",
              maxWidth: 400,
              maxHeight: "80%",
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 24, marginRight: 12 }}>🚩</Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: colors.text,
                  flex: 1,
                }}
              >
                Signaler la question
              </Text>
              <TouchableOpacity
                onPress={closeReportModal}
                style={{ padding: 4 }}
              >
                <Text style={{ fontSize: 24, color: colors.textMuted }}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Report Type Selection */}
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.textSecondary,
                marginBottom: 12,
              }}
            >
              Type de problème
            </Text>
            <ScrollView
              style={{ maxHeight: 200 }}
              showsVerticalScrollIndicator={false}
            >
              {(Object.keys(REPORT_TYPE_LABELS) as ReportType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setSelectedReportType(type)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    backgroundColor:
                      selectedReportType === type
                        ? colors.primaryMuted
                        : colors.backgroundSecondary,
                    borderRadius: 12,
                    marginBottom: 8,
                    borderWidth: 2,
                    borderColor:
                      selectedReportType === type
                        ? colors.primary
                        : "transparent",
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor:
                        selectedReportType === type
                          ? colors.primary
                          : colors.border,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    {selectedReportType === type && (
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: colors.primary,
                        }}
                      />
                    )}
                  </View>
                  <Text
                    style={{
                      color:
                        selectedReportType === type
                          ? colors.primary
                          : colors.text,
                      fontSize: 15,
                      fontWeight: selectedReportType === type ? "600" : "400",
                    }}
                  >
                    {REPORT_TYPE_LABELS[type]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Description Input */}
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.textSecondary,
                marginTop: 16,
                marginBottom: 8,
              }}
            >
              Description (optionnel)
            </Text>
            <TextInput
              value={reportDescription}
              onChangeText={setReportDescription}
              placeholder="Décrivez le problème..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 12,
                padding: 12,
                color: colors.text,
                fontSize: 15,
                minHeight: 80,
                textAlignVertical: "top",
              }}
            />

            {/* Actions */}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
              <TouchableOpacity
                onPress={closeReportModal}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: colors.backgroundSecondary,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontWeight: "600",
                    fontSize: 15,
                  }}
                >
                  Annuler
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmitReport}
                disabled={!selectedReportType || reportSubmitting}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: selectedReportType
                    ? colors.primary
                    : colors.border,
                  alignItems: "center",
                  opacity: reportSubmitting ? 0.7 : 1,
                }}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}
                >
                  {reportSubmitting ? "Envoi..." : "Envoyer"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={Platform.OS === "web" ? [] : ["bottom"]}
      >
        {/* Progress Bar */}
        <View
          style={{ height: 4, backgroundColor: colors.backgroundSecondary }}
        >
          <Animated.View
            style={{
              height: "100%",
              backgroundColor: colors.primary,
              width: progressWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
            }}
          />
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 16 }}
        >
          {/* Question Header */}
          <Animated.View
            style={{
              opacity: questionFade,
              transform: [{ translateY: questionSlide }],
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Badge
                label={`Q${currentQuestion.number}`}
                variant="primary"
                style={{ marginRight: 8 }}
              />
              {(currentQuestion.exam_type || currentQuestion.exam_year) && (
                <Badge
                  label={`${currentQuestion.exam_type || ""}${currentQuestion.exam_year ? ` M${currentQuestion.exam_year % 100}` : ""}`.trim()}
                  variant="secondary"
                />
              )}
            </View>
            <Animated.View
              style={{
                transform: [{ scale: saveButtonScale }],
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              {/* Report Button */}
              <TouchableOpacity
                onPress={openReportModal}
                disabled={reportedQuestions.has(currentQuestion.id)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: reportedQuestions.has(currentQuestion.id)
                    ? colors.warningLight
                    : colors.backgroundSecondary,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: reportedQuestions.has(currentQuestion.id) ? 0.6 : 1,
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 18 }}>
                  {reportedQuestions.has(currentQuestion.id) ? "✓" : "🚩"}
                </Text>
              </TouchableOpacity>
              {/* Save Button */}
              <TouchableOpacity
                onPress={toggleSave}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: isSaved
                    ? colors.primaryLight
                    : colors.backgroundSecondary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 20 }}>{isSaved ? "💾" : "📥"}</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* Question Text */}
          <Animated.View
            style={{
              opacity: questionFade,
              transform: [{ translateY: questionSlide }],
              marginBottom: 16,
            }}
          >
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{ color: colors.text, fontSize: 16, lineHeight: 24 }}
              >
                {currentQuestion.question_text}
              </Text>
              {currentQuestion.image_url && (
                <Image
                  source={{ uri: currentQuestion.image_url }}
                  style={{
                    width: "100%",
                    height: 192,
                    marginTop: 16,
                    borderRadius: 8,
                  }}
                  resizeMode="contain"
                />
              )}
            </View>
          </Animated.View>

          {/* Answer Options */}
          <View style={{ gap: 12 }}>
            {currentQuestion.answers.map((answer, index) => {
              const isSelected = currentAnswers.includes(answer.option_label);
              const isCorrect = answer.is_correct;

              let cardBg = colors.card;
              let borderColor = colors.border;
              let textColor = colors.text;

              if (isSubmitted) {
                if (isCorrect) {
                  cardBg = colors.successLight;
                  borderColor = colors.success;
                  textColor = colors.success;
                } else if (isSelected && !isCorrect) {
                  cardBg = colors.errorLight;
                  borderColor = colors.error;
                  textColor = colors.error;
                }
              } else if (isSelected) {
                cardBg = colors.primaryLight;
                borderColor = colors.primary;
                textColor = colors.primary;
              }

              return (
                <AnimatedAnswerOption
                  key={answer.id}
                  answer={answer}
                  index={index}
                  isSelected={isSelected}
                  isEliminated={currentEliminated.includes(answer.option_label)}
                  isCorrect={isCorrect}
                  isSubmitted={isSubmitted}
                  cardBg={cardBg}
                  borderColor={borderColor}
                  textColor={textColor}
                  onPress={() => selectAnswer(answer.option_label)}
                  onLongPress={() => toggleEliminate(answer.option_label)}
                  questionFade={questionFade}
                  colors={colors}
                />
              );
            })}
          </View>

          {/* Feature Hint */}
          {!isSubmitted && (
            <Text
              style={{
                textAlign: "center",
                marginTop: 16,
                fontSize: 12,
                color: colors.textMuted,
              }}
            >
              💡 Astuce : Appui long pour éliminer une option
            </Text>
          )}

          {/* Explanation */}
          {isSubmitted && currentQuestion.explanation && (
            <Animated.View
              style={{
                opacity: questionFade,
                transform: [{ translateY: questionSlide }],
                marginTop: 24,
              }}
            >
              <View
                style={{
                  backgroundColor: colors.primaryMuted,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.primaryLight,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ fontSize: 20, marginRight: 8 }}>💡</Text>
                  <Text
                    style={{
                      fontWeight: "bold",
                      color: colors.primary,
                      fontSize: 16,
                    }}
                  >
                    Explication
                  </Text>
                </View>
                <Text
                  style={{ color: colors.text, fontSize: 15, lineHeight: 22 }}
                >
                  {currentQuestion.explanation}
                </Text>
              </View>
            </Animated.View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom Actions */}
        <FadeInView animation="slideUp" delay={200} replayOnFocus={false}>
          <View
            style={{
              backgroundColor: colors.card,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              paddingHorizontal: 24,
              paddingVertical: 16,
              paddingBottom: Platform.OS === "web" ? 16 : 24,
            }}
          >
            {/* End Session Button */}
            <TouchableOpacity
              onPress={finishPractice}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 20,
                alignSelf: "center",
                marginBottom: 12,
                backgroundColor: colors.backgroundSecondary,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.textMuted,
                  marginRight: 8,
                }}
              />
              <Text
                style={{
                  color: colors.textSecondary,
                  fontWeight: "500",
                  fontSize: 13,
                }}
              >
                Terminer ({submittedQuestions.size}/{questions.length})
              </Text>
            </TouchableOpacity>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <AnimatedNavButton
                label="← Précédent"
                onPress={goToPrevious}
                disabled={currentIndex === 0}
                colors={colors}
              />

              {/* Skip / Validate / Next buttons */}
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                {!isSubmitted && currentIndex < questions.length - 1 && (
                  <TouchableOpacity
                    onPress={skipQuestion}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderRadius: 8,
                      backgroundColor: colors.backgroundSecondary,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontWeight: "500",
                        fontSize: 14,
                      }}
                    >
                      Sauter
                    </Text>
                  </TouchableOpacity>
                )}

                {!isSubmitted ? (
                  <Button
                    title="Valider"
                    onPress={submitAnswer}
                    disabled={currentAnswers.length === 0}
                    variant="primary"
                  />
                ) : currentIndex < questions.length - 1 ? (
                  <Button
                    title="Suivant →"
                    onPress={goToNext}
                    variant="primary"
                  />
                ) : (
                  <Button
                    title="Voir résultats"
                    onPress={saveResults}
                    variant="primary"
                  />
                )}
              </View>
            </View>
          </View>
        </FadeInView>
      </SafeAreaView>
    </>
  );
}

// Animated Answer Option
function AnimatedAnswerOption({
  answer,
  index,
  isSelected,
  isEliminated,
  isCorrect,
  isSubmitted,
  cardBg,
  borderColor,
  textColor,
  onPress,
  onLongPress,
  questionFade,
  colors,
}: any) {
  const scale = useRef(new Animated.Value(1)).current;
  const slideIn = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.timing(slideIn, {
      toValue: 0,
      duration: ANIMATION_DURATION.normal,
      delay: index * 50,
      easing: ANIMATION_EASING.premium,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [index]);

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: 0.98,
      duration: 100,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      tension: 200,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  };

  // If eliminated, override styles to look disabled/crossed out
  const finalCardBg = isEliminated ? colors.background : cardBg;
  const finalBorderColor = isEliminated ? colors.border : borderColor;
  const finalTextColor = isEliminated ? colors.textMuted : textColor;
  const finalOpacity = isEliminated ? 0.6 : 1;

  return (
    <Animated.View
      style={{
        opacity: questionFade,
        transform: [{ translateY: slideIn }, { scale }],
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isSubmitted}
        activeOpacity={isEliminated ? 1 : 0.7}
        delayLongPress={200}
      >
        <View
          style={{
            backgroundColor: finalCardBg,
            borderRadius: 16,
            padding: 16,
            borderWidth: 2,
            borderColor: finalBorderColor,
            opacity: finalOpacity,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: isSelected
                  ? colors.primary
                  : colors.backgroundSecondary,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
                opacity: isEliminated ? 0.5 : 1,
              }}
            >
              <Text
                style={{
                  fontWeight: "bold",
                  color: isSelected ? "#ffffff" : colors.textMuted,
                  textDecorationLine: isEliminated ? "line-through" : "none",
                }}
              >
                {answer.option_label}
              </Text>
            </View>
            <Text
              style={{
                flex: 1,
                color: finalTextColor,
                fontSize: 16,
                lineHeight: 22,
                textDecorationLine: isEliminated ? "line-through" : "none",
              }}
            >
              {answer.answer_text}
            </Text>
            {isSubmitted && isCorrect && (
              <Text
                style={{ color: colors.success, fontSize: 20, marginLeft: 8 }}
              >
                ✓
              </Text>
            )}
            {isSubmitted && isSelected && !isCorrect && (
              <Text
                style={{ color: colors.error, fontSize: 20, marginLeft: 8 }}
              >
                ✗
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Animated Navigation Button
function AnimatedNavButton({
  label,
  onPress,
  disabled,
  colors,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
  colors: any;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!disabled)
      Animated.timing(scale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      tension: 200,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 8,
          backgroundColor: !disabled
            ? colors.backgroundSecondary
            : colors.background,
        }}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}
      >
        <Text
          style={{
            fontWeight: "500",
            color: !disabled ? colors.textSecondary : colors.textMuted,
          }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
