import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ModuleData } from '../types';

interface Props {
  module: ModuleData;
  onPress: () => void;
  cardWidth: number;
}

const getIconName = (iconName: string): keyof typeof Ionicons.glyphMap => {
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    heart: 'heart',
    brain: 'body',
    pill: 'medical',
    wind: 'cloud',
  };
  return iconMap[iconName] || 'book';
};

export default function ModuleCard({ module, onPress, cardWidth }: Props) {
  const progressPercentage = Math.round((module.completedQuestions / module.totalQuestions) * 100);
  const accuracy = module.completedQuestions > 0 ? Math.round((module.correctAnswers / module.completedQuestions) * 100) : 0;
  
  return (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: module.color + '20' }]}>
        <Ionicons 
          name={getIconName(module.iconName)} 
          size={32} 
          color={module.color} 
        />
      </View>
      
      <Text style={styles.moduleName}>{module.name}</Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Progress</Text>
          <Text style={styles.statValue}>{progressPercentage}%</Text>
        </View>
        
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
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Questions</Text>
          <Text style={styles.statValue}>{module.completedQuestions}/{module.totalQuestions}</Text>
        </View>
        
        {module.completedQuestions > 0 && (
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Accuracy</Text>
            <Text style={[styles.statValue, { color: accuracy >= 70 ? '#10b981' : '#ef4444' }]}>
              {accuracy}%
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  moduleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  statsContainer: {
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});