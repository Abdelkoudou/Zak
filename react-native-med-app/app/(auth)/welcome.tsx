// ============================================================================
// Welcome Screen
// ============================================================================

import { View, Text, Image, TouchableOpacity } from 'react-native'
import { Link } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function WelcomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 py-8">
        {/* Logo & Title */}
        <View className="flex-1 items-center justify-center">
          <View className="w-24 h-24 bg-primary-500 rounded-3xl items-center justify-center mb-6">
            <Text className="text-white text-4xl">📚</Text>
          </View>
          
          <Text className="text-3xl font-bold text-gray-900 text-center mb-2">
            MCQ Study App
          </Text>
          
          <Text className="text-lg text-gray-500 text-center mb-8">
            Préparez vos examens médicaux
          </Text>

          {/* Features */}
          <View className="w-full space-y-4 mb-8">
            <FeatureItem 
              icon="📝" 
              title="QCM par module" 
              description="Questions organisées par année et module"
            />
            <FeatureItem 
              icon="📊" 
              title="Suivi de progression" 
              description="Statistiques détaillées de vos performances"
            />
            <FeatureItem 
              icon="💾" 
              title="Questions sauvegardées" 
              description="Révisez les questions difficiles"
            />
            <FeatureItem 
              icon="📁" 
              title="Ressources" 
              description="Accédez aux cours et documents"
            />
          </View>
        </View>

        {/* Buttons */}
        <View className="space-y-3">
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity className="bg-primary-500 py-4 rounded-xl">
              <Text className="text-white text-center font-semibold text-lg">
                Créer un compte
              </Text>
            </TouchableOpacity>
          </Link>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity className="bg-gray-100 py-4 rounded-xl">
              <Text className="text-gray-700 text-center font-semibold text-lg">
                Se connecter
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  )
}

// Feature Item Component
function FeatureItem({ icon, title, description }: { 
  icon: string
  title: string
  description: string 
}) {
  return (
    <View className="flex-row items-center bg-gray-50 p-4 rounded-xl">
      <View className="w-12 h-12 bg-primary-100 rounded-xl items-center justify-center mr-4">
        <Text className="text-2xl">{icon}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-gray-900 font-semibold">{title}</Text>
        <Text className="text-gray-500 text-sm">{description}</Text>
      </View>
    </View>
  )
}
