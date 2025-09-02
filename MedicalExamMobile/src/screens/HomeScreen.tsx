import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { modules } from '../data';
import { ModuleData } from '../types';
import ModuleCard from '../components/ModuleCard';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // Account for padding and gap

export default function HomeScreen({ navigation }: Props) {
  const handleModulePress = (module: ModuleData) => {
    navigation.navigate('Module', { module });
  };

  const renderModule = ({ item }: { item: ModuleData }) => (
    <ModuleCard
      module={item}
      onPress={() => handleModulePress(item)}
      cardWidth={cardWidth}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.appTitle}>Medical Exam Prep</Text>
        <Text style={styles.subtitle}>Choose a module to start practicing</Text>
      </View>

      <View style={styles.content}>
        <FlatList
          data={modules}
          renderItem={renderModule}
          keyExtractor={(item) => item.slug}
          numColumns={2}
          contentContainerStyle={styles.modulesList}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  welcomeText: {
    fontSize: 16,
    color: '#bfdbfe',
    textAlign: 'center',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginVertical: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#bfdbfe',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  modulesList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
});