import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Question, PracticeSession } from '../types';
import { sampleQuestions } from '../data';

type PracticeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Practice'>;
type PracticeScreenRouteProp = RouteProp<RootStackParamList, 'Practice'>;

interface Props {
  navigation: PracticeScreenNavigationProp;
  route: PracticeScreenRouteProp;
}

export default function PracticeScreen({ navigation, route }: Props) {
  const { module, topic } = route.params;
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load questions for this topic
    const topicKey = `${module.slug}-${topic.id}`;
    const questions = sampleQuestions[topicKey] || [];
    
    if (questions.length === 0) {
      Alert.alert(
        'No Questions Available',
        'There are no questions available for this topic yet.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }

    setSession({
      questions,
      currentQuestionIndex: 0,
      userAnswers: {},
      showExplanation: false,
      isCompleted: false,
      startTime: new Date(),
    });
    setIsLoading(false);
  }, [module.slug, topic.id, navigation]);

  if (isLoading || !session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading practice session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = session.questions[session.currentQuestionIndex];
  const progress = ((session.currentQuestionIndex + 1) / session.questions.length) * 100;
  const isLastQuestion = session.currentQuestionIndex === session.questions.length - 1;

  const handleAnswerSelect = (answerId: string) => {
    if (session.showExplanation) return;
    setSelectedAnswer(answerId);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) return;

    const newUserAnswers = {
      ...session.userAnswers,
      [currentQuestion.id]: selectedAnswer,
    };

    setSession({
      ...session,
      userAnswers: newUserAnswers,
      showExplanation: true,
    });
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      // Calculate final score
      const correctAnswers = Object.keys(session.userAnswers).filter(questionId => {
        const question = session.questions.find(q => q.id === questionId);
        const userAnswer = session.userAnswers[questionId];
        const correctAnswer = question?.answers.find(a => a.isCorrect);
        return userAnswer === correctAnswer?.id;
      }).length;

      const score = Math.round((correctAnswers / session.questions.length) * 100);

      navigation.navigate('Results', {
        module,
        topic,
        score,
        totalQuestions: session.questions.length,
        correctAnswers,
      });
    } else {
      setSession({
        ...session,
        currentQuestionIndex: session.currentQuestionIndex + 1,
        showExplanation: false,
      });
      setSelectedAnswer(null);
    }
  };

  const handlePreviousQuestion = () => {
    if (session.currentQuestionIndex > 0) {
      const prevQuestion = session.questions[session.currentQuestionIndex - 1];
      const prevAnswer = session.userAnswers[prevQuestion.id];
      
      setSession({
        ...session,
        currentQuestionIndex: session.currentQuestionIndex - 1,
        showExplanation: !!prevAnswer,
      });
      setSelectedAnswer(prevAnswer || null);
    }
  };

  const getAnswerStyle = (answer: any) => {
    if (!session.showExplanation && selectedAnswer === answer.id) {
      return [styles.answerOption, styles.selectedAnswer];
    }
    
    if (session.showExplanation) {
      if (answer.isCorrect) {
        return [styles.answerOption, styles.correctAnswer];
      }
      if (selectedAnswer === answer.id && !answer.isCorrect) {
        return [styles.answerOption, styles.incorrectAnswer];
      }
    }
    
    return styles.answerOption;
  };

  const getAnswerIconName = (answer: any): keyof typeof Ionicons.glyphMap => {
    if (!session.showExplanation) {
      return selectedAnswer === answer.id ? 'radio-button-on' : 'radio-button-off';
    }
    
    if (answer.isCorrect) {
      return 'checkmark-circle';
    }
    if (selectedAnswer === answer.id && !answer.isCorrect) {
      return 'close-circle';
    }
    
    return 'radio-button-off';
  };

  const getAnswerIconColor = (answer: any) => {
    if (!session.showExplanation && selectedAnswer === answer.id) {
      return module.color;
    }
    
    if (session.showExplanation) {
      if (answer.isCorrect) {
        return '#10b981';
      }
      if (selectedAnswer === answer.id && !answer.isCorrect) {
        return '#ef4444';
      }
    }
    
    return '#9ca3af';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Progress Header */}
      <View style={[styles.progressHeader, { backgroundColor: module.color }]}>
        <Text style={styles.progressText}>
          Question {session.currentQuestionIndex + 1} of {session.questions.length}
        </Text>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Question */}
        <View style={styles.questionContainer}>
          <View style={styles.questionHeader}>
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>{currentQuestion.difficulty}</Text>
            </View>
            <Text style={styles.topicText}>{currentQuestion.topic}</Text>
          </View>
          
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </View>

        {/* Answers */}
        <View style={styles.answersContainer}>
          {currentQuestion.answers.map((answer, index) => (
            <TouchableOpacity
              key={answer.id}
              style={getAnswerStyle(answer)}
              onPress={() => handleAnswerSelect(answer.id)}
              activeOpacity={0.7}
              disabled={session.showExplanation}
            >
              <View style={styles.answerContent}>
                <Ionicons
                  name={getAnswerIconName(answer)}
                  size={24}
                  color={getAnswerIconColor(answer)}
                />
                <Text style={styles.answerText}>{answer.text}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Explanation */}
        {session.showExplanation && (
          <View style={styles.explanationContainer}>
            <View style={styles.explanationHeader}>
              <Ionicons name="book" size={20} color={module.color} />
              <Text style={styles.explanationTitle}>Explanation</Text>
            </View>
            <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
            <Text style={styles.referenceText}>Reference: {currentQuestion.reference}</Text>
          </View>
        )}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, styles.previousButton]}
          onPress={handlePreviousQuestion}
          disabled={session.currentQuestionIndex === 0}
        >
          <Ionicons name="chevron-back" size={20} color="#6b7280" />
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>

        {!session.showExplanation ? (
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.submitButton,
              { backgroundColor: selectedAnswer ? module.color : '#d1d5db' }
            ]}
            onPress={handleSubmitAnswer}
            disabled={!selectedAnswer}
          >
            <Text style={[styles.navButtonText, { color: '#ffffff' }]}>Submit Answer</Text>
            <Ionicons name="checkmark" size={20} color="#ffffff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navButton, styles.submitButton, { backgroundColor: module.color }]}
            onPress={handleNextQuestion}
          >
            <Text style={[styles.navButtonText, { color: '#ffffff' }]}>
              {isLastQuestion ? 'Complete' : 'Next Question'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  progressHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressText: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  questionContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  difficultyBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
  },
  topicText: {
    fontSize: 12,
    color: '#6b7280',
  },
  questionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1f2937',
  },
  answersContainer: {
    gap: 12,
    marginBottom: 20,
  },
  answerOption: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
  },
  selectedAnswer: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  correctAnswer: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  incorrectAnswer: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  answerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  answerText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#1f2937',
  },
  explanationContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
    marginBottom: 12,
  },
  referenceText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  navigation: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  previousButton: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  submitButton: {
    flex: 2,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
});