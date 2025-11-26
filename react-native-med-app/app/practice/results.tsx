// ============================================================================
// Results Screen
// ============================================================================

import { View, Text, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, router, Stack } from 'expo-router'

export default function ResultsScreen() {
  const { total, correct, score, time, moduleName } = useLocalSearchParams<{
    total: string
    correct: string
    score: string
    time: string
    moduleName: string
  }>()

  const totalNum = parseInt(total || '0')
  const correctNum = parseInt(correct || '0')
  const scoreNum = parseFloat(score || '0')
  const timeNum = parseInt(time || '0')
  const incorrectNum = totalNum - correctNum

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const getScoreColor = () => {
    if (scoreNum >= 80) return 'text-green-500'
    if (scoreNum >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getScoreEmoji = () => {
    if (scoreNum >= 80) return '🎉'
    if (scoreNum >= 60) return '👍'
    if (scoreNum >= 40) return '💪'
    return '📚'
  }

  const getScoreMessage = () => {
    if (scoreNum >= 80) return 'Excellent travail !'
    if (scoreNum >= 60) return 'Bon travail !'
    if (scoreNum >= 40) return 'Continuez vos efforts !'
    return 'Révisez et réessayez !'
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Résultats', headerBackVisible: false }} />
      
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 px-6 py-8">
          {/* Score Circle */}
          <View className="items-center mb-8">
            <View className="w-40 h-40 rounded-full bg-white shadow-lg items-center justify-center mb-4">
              <Text className="text-5xl mb-2">{getScoreEmoji()}</Text>
              <Text className={`text-4xl font-bold ${getScoreColor()}`}>
                {scoreNum.toFixed(0)}%
              </Text>
            </View>
            <Text className="text-xl font-semibold text-gray-900">
              {getScoreMessage()}
            </Text>
            <Text className="text-gray-500 mt-1">{moduleName}</Text>
          </View>

          {/* Stats Cards */}
          <View className="bg-white rounded-2xl p-6 mb-6">
            <View className="flex-row justify-between mb-4">
              <StatItem 
                label="Total" 
                value={totalNum.toString()} 
                icon="📝"
              />
              <StatItem 
                label="Correctes" 
                value={correctNum.toString()} 
                icon="✅"
                color="text-green-500"
              />
              <StatItem 
                label="Incorrectes" 
                value={incorrectNum.toString()} 
                icon="❌"
                color="text-red-500"
              />
            </View>
            
            <View className="border-t border-gray-100 pt-4">
              <View className="flex-row items-center justify-center">
                <Text className="text-2xl mr-2">⏱️</Text>
                <Text className="text-gray-500">Temps: </Text>
                <Text className="text-gray-900 font-semibold">{formatTime(timeNum)}</Text>
              </View>
            </View>
          </View>

          {/* Progress Bar */}
          <View className="bg-white rounded-2xl p-4 mb-8">
            <Text className="text-gray-500 text-sm mb-2">Progression</Text>
            <View className="h-4 bg-gray-100 rounded-full overflow-hidden flex-row">
              <View 
                className="h-full bg-green-500"
                style={{ width: `${(correctNum / totalNum) * 100}%` }}
              />
              <View 
                className="h-full bg-red-400"
                style={{ width: `${(incorrectNum / totalNum) * 100}%` }}
              />
            </View>
            <View className="flex-row justify-between mt-2">
              <Text className="text-green-500 text-sm">{correctNum} correctes</Text>
              <Text className="text-red-400 text-sm">{incorrectNum} incorrectes</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="space-y-3">
            <TouchableOpacity
              className="bg-primary-500 py-4 rounded-xl"
              onPress={() => router.back()}
            >
              <Text className="text-white text-center font-semibold text-lg">
                Pratiquer à nouveau
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-gray-100 py-4 rounded-xl"
              onPress={() => router.replace('/(tabs)')}
            >
              <Text className="text-gray-700 text-center font-semibold text-lg">
                Retour à l'accueil
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </>
  )
}

// Stat Item Component
function StatItem({ 
  label, 
  value, 
  icon, 
  color = 'text-gray-900' 
}: { 
  label: string
  value: string
  icon: string
  color?: string
}) {
  return (
    <View className="items-center flex-1">
      <Text className="text-2xl mb-1">{icon}</Text>
      <Text className={`text-2xl font-bold ${color}`}>{value}</Text>
      <Text className="text-gray-500 text-sm">{label}</Text>
    </View>
  )
}
