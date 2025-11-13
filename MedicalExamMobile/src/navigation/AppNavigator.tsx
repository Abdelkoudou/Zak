import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ModuleData, Topic } from '../types';

// Screens
import {
  HomeScreen,
  ModuleScreen,
  PracticeScreen,
  ResultsScreen,
} from '../screens';

export type RootStackParamList = {
  Home: undefined;
  Module: { module: ModuleData };
  Practice: { module: ModuleData; topic: Topic };
  Results: { 
    module: ModuleData; 
    topic: Topic; 
    score: number; 
    totalQuestions: number;
    correctAnswers: number;
  };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0ea5e9',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ 
            title: 'Medical Exam Modules',
            headerStyle: {
              backgroundColor: '#0ea5e9',
            },
          }} 
        />
        <Stack.Screen 
          name="Module" 
          component={ModuleScreen} 
          options={({ route }) => ({ 
            title: route.params.module.name,
            headerStyle: {
              backgroundColor: route.params.module.color,
            },
          })} 
        />
        <Stack.Screen 
          name="Practice" 
          component={PracticeScreen} 
          options={({ route }) => ({ 
            title: `${route.params.topic.name} Practice`,
            headerStyle: {
              backgroundColor: route.params.module.color,
            },
          })} 
        />
        <Stack.Screen 
          name="Results" 
          component={ResultsScreen} 
          options={{ 
            title: 'Practice Results',
            headerLeft: () => null, // Prevent back navigation
          }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}