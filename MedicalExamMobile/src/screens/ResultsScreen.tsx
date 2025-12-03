import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';

type ResultsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Results'>;
type ResultsScreenRouteProp = RouteProp<RootStackParamList, 'Results'>;

interface Props {
  navigation: ResultsScreenNavigationProp;
  route: ResultsScreenRouteProp;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
};

const getScoreGrade = (score: number) => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

const getScoreMessage = (score: number) => {
  if (score >= 90) return 'Excellent work! You have mastered this topic.';
  if (score >= 80) return 'Great job! You have a strong understanding.';
  if (score >= 70) return 'Good work! Keep practicing to improve.';
  if (score >= 60) return 'You\'re on the right track. Review the material and try again.';
  return 'Keep studying and don\'t give up. Practice makes perfect!';
};

export default function ResultsScreen({ navigation, route }: Props) {
  const { module, topic, score, totalQuestions, correctAnswers } = route.params;

  const handleReturnHome = () => {
    navigation.navigate('Home');
  };

  const handleRetryPractice = () => {
    navigation.navigate('Practice', { module, topic });
  };

  const handleBackToModule = () => {
    navigation.navigate('Module', { module });
  };

  const scoreColor = getScoreColor(score);
  const grade = getScoreGrade(score);
  const message = getScoreMessage(score);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: module.color }]}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name={score >= 70 ? "trophy" : "medal"} 
              size={48} 
              color="#ffffff" 
            />
          </View>
          <Text style={styles.headerTitle}>Practice Complete!</Text>
          <Text style={styles.headerSubtitle}>{topic.name}</Text>
        </View>

        {/* Score Card */}
        <View style={styles.scoreCard}>
          <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
            <Text style={[styles.scoreText, { color: scoreColor }]}>{score}%</Text>
            <Text style={[styles.gradeText, { color: scoreColor }]}>Grade {grade}</Text>
          </View>
          
          <Text style={styles.scoreMessage}>{message}</Text>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Performance Summary</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              <Text style={styles.statNumber}>{correctAnswers}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="close-circle" size={24} color="#ef4444" />
              <Text style={styles.statNumber}>{totalQuestions - correctAnswers}</Text>
              <Text style={styles.statLabel}>Incorrect</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="help-circle" size={24} color="#6b7280" />
              <Text style={styles.statNumber}>{totalQuestions}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Your Progress</Text>
            <Text style={styles.progressPercentage}>{score}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${score}%`,
                  backgroundColor: scoreColor,
                }
              ]} 
            />
          </View>
        </View>

        {/* Recommendations */}
        <View style={styles.recommendationsContainer}>
          <Text style={styles.sectionTitle}>Next Steps</Text>
          
          {score < 70 && (
            <View style={styles.recommendationCard}>
              <Ionicons name="book" size={20} color="#f59e0b" />
              <View style={styles.recommendationContent}>
                <Text style={styles.recommendationTitle}>Review Material</Text>
                <Text style={styles.recommendationText}>
                  Consider reviewing the study material for this topic before retrying.
                </Text>
              </View>
            </View>
          )}
          
          {score >= 70 && (
            <View style={styles.recommendationCard}>
              <Ionicons name="trending-up" size={20} color="#10b981" />
              <View style={styles.recommendationContent}>
                <Text style={styles.recommendationTitle}>Great Progress!</Text>
                <Text style={styles.recommendationText}>
                  You're doing well. Try other topics or retake this one for even better results.
                </Text>
              </View>
            </View>
          )}
          
          <View style={styles.recommendationCard}>
            <Ionicons name="refresh" size={20} color="#3b82f6" />
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationTitle}>Practice More</Text>
              <Text style={styles.recommendationText}>
                Regular practice helps improve retention and understanding.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleRetryPractice}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={20} color={module.color} />
          <Text style={[styles.secondaryButtonText, { color: module.color }]}>
            Retry Practice
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleBackToModule}
          activeOpacity={0.7}
        >
          <Ionicons name="library" size={20} color="#6b7280" />
          <Text style={styles.secondaryButtonText}>Back to Topics</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: module.color }]}
          onPress={handleReturnHome}
          activeOpacity={0.7}
        >
          <Ionicons name="home" size={20} color="#ffffff" />
          <Text style={styles.primaryButtonText}>Return Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  iconContainer: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scoreCard: {
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  gradeText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  scoreMessage: {
    fontSize: 16,
    textAlign: 'center',
    color: '#374151',
    lineHeight: 24,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#ffffff',
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  progressContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  recommendationsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  recommendationCard: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  recommendationContent: {
    flex: 1,
    marginLeft: 12,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
});