import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Topic } from '../types';

type ModuleScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Module'>;
type ModuleScreenRouteProp = RouteProp<RootStackParamList, 'Module'>;

interface Props {
  navigation: ModuleScreenNavigationProp;
  route: ModuleScreenRouteProp;
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Beginner':
      return '#10b981';
    case 'Intermediate':
      return '#f59e0b';
    case 'Advanced':
      return '#ef4444';
    default:
      return '#6b7280';
  }
};

const getDifficultyIcon = (difficulty: string): keyof typeof Ionicons.glyphMap => {
  switch (difficulty) {
    case 'Beginner':
      return 'leaf';
    case 'Intermediate':
      return 'flash';
    case 'Advanced':
      return 'flame';
    default:
      return 'help-circle';
  }
};

export default function ModuleScreen({ navigation, route }: Props) {
  const { module } = route.params;

  const handleTopicPress = (topic: Topic) => {
    navigation.navigate('Practice', { module, topic });
  };

  const renderTopic = ({ item }: { item: Topic }) => {
    const progressPercentage = Math.round((item.completedQuestions / item.totalQuestions) * 100);
    const accuracy = item.completedQuestions > 0 ? Math.round((item.correctAnswers / item.completedQuestions) * 100) : 0;
    
    return (
      <TouchableOpacity
        style={styles.topicCard}
        onPress={() => handleTopicPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.topicHeader}>
          <View style={styles.topicTitleContainer}>
            <Text style={styles.topicName}>{item.name}</Text>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) + '20' }]}>
              <Ionicons 
                name={getDifficultyIcon(item.difficulty)} 
                size={12} 
                color={getDifficultyColor(item.difficulty)} 
              />
              <Text style={[styles.difficultyText, { color: getDifficultyColor(item.difficulty) }]}>
                {item.difficulty}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6b7280" />
        </View>
        
        <Text style={styles.topicDescription}>{item.description}</Text>
        
        <View style={styles.topicStats}>
          <View style={styles.statGroup}>
            <Ionicons name="time" size={16} color="#6b7280" />
            <Text style={styles.statText}>{item.estimatedTime} min</Text>
          </View>
          
          <View style={styles.statGroup}>
            <Ionicons name="help-circle" size={16} color="#6b7280" />
            <Text style={styles.statText}>{item.totalQuestions} questions</Text>
          </View>
          
          <View style={styles.statGroup}>
            <Ionicons name="checkmark-circle" size={16} color="#6b7280" />
            <Text style={styles.statText}>{progressPercentage}% complete</Text>
          </View>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${progressPercentage}%`,
                  backgroundColor: module.color,
                }
              ]} 
            />
          </View>
          
          {item.completedQuestions > 0 && (
            <Text style={[styles.accuracyText, { color: accuracy >= 70 ? '#10b981' : '#ef4444' }]}>
              {accuracy}% accuracy
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const moduleProgress = Math.round((module.completedQuestions / module.totalQuestions) * 100);
  const moduleAccuracy = module.completedQuestions > 0 ? Math.round((module.correctAnswers / module.completedQuestions) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Module Overview */}
        <View style={[styles.moduleHeader, { backgroundColor: module.color }]}>
          <Text style={styles.moduleDescription}>{module.description}</Text>
          
          <View style={styles.moduleStatsContainer}>
            <View style={styles.moduleStatCard}>
              <Text style={styles.moduleStatNumber}>{moduleProgress}%</Text>
              <Text style={styles.moduleStatLabel}>Progress</Text>
            </View>
            
            <View style={styles.moduleStatCard}>
              <Text style={styles.moduleStatNumber}>{module.completedQuestions}</Text>
              <Text style={styles.moduleStatLabel}>Completed</Text>
            </View>
            
            <View style={styles.moduleStatCard}>
              <Text style={styles.moduleStatNumber}>{moduleAccuracy}%</Text>
              <Text style={styles.moduleStatLabel}>Accuracy</Text>
            </View>
          </View>
        </View>

        {/* Topics List */}
        <View style={styles.topicsContainer}>
          <Text style={styles.sectionTitle}>Study Topics</Text>
          
          <FlatList
            data={module.topics}
            renderItem={renderTopic}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.topicsList}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  moduleHeader: {
    padding: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  moduleDescription: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 24,
    marginBottom: 20,
  },
  moduleStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moduleStatCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  moduleStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  moduleStatLabel: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.8,
    marginTop: 4,
  },
  topicsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  topicsList: {
    gap: 16,
  },
  topicCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  topicTitleContainer: {
    flex: 1,
  },
  topicName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  topicDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  topicStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6b7280',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  accuracyText: {
    fontSize: 12,
    fontWeight: '600',
  },
});