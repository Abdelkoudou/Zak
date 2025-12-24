// ============================================================================
// Results Screen - Light Sea Green Brand (Matching Design)
// ============================================================================

import { View, Text, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, router, Stack } from 'expo-router'
import { Card, Button } from '@/components/ui'
import { BRAND_THEME } from '@/constants/theme'

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
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours}h ${mins}m ${secs}s`
  }

  const getScoreMessage = () => {
    if (scoreNum >= 80) return 'Excellent travail !'
    if (scoreNum >= 60) return 'Bon travail !'
    if (scoreNum >= 40) return 'Continuez vos efforts !'
    return 'Révisez et réessayez !'
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Résultat', headerBackVisible: false }} />
      
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_THEME.colors.gray[50] }}>
        <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 32 }}>
          {/* Score Circle - Matching Design */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View style={{
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: '#ffffff',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              ...BRAND_THEME.shadows.lg
            }}>
              <Text style={{ fontSize: 48, marginBottom: 8 }}>📚</Text>
              <Text style={{
                fontSize: 36,
                fontWeight: 'bold',
                color: BRAND_THEME.colors.gray[900]
              }}>
                {scoreNum.toFixed(0)}%
              </Text>
            </View>
            
            <Text style={{
              fontSize: 20,
              fontWeight: '600',
              color: BRAND_THEME.colors.gray[900],
              marginBottom: 4
            }}>
              {getScoreMessage()}
            </Text>
            <Text style={{
              color: BRAND_THEME.colors.gray[600],
              fontSize: 16
            }}>
              {moduleName}
            </Text>
          </View>

          {/* Stats Cards - Matching Design */}
          <Card variant="default" padding="md" style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <StatItem 
                label="Total" 
                value={totalNum.toString()} 
                icon="📝"
              />
              <StatItem 
                label="Correctes" 
                value={`${scoreNum.toFixed(0)}%`} 
                icon="✅"
              />
              <StatItem 
                label="Incorrectes" 
                value={incorrectNum.toString()} 
                icon="❌"
              />
            </View>
            
            <View style={{
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: BRAND_THEME.colors.gray[100],
              alignItems: 'center'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, marginRight: 8 }}>⏱️</Text>
                <Text style={{ color: BRAND_THEME.colors.gray[600] }}>Temps : </Text>
                <Text style={{
                  color: BRAND_THEME.colors.gray[900],
                  fontWeight: '600'
                }}>
                  {formatTime(timeNum)}
                </Text>
              </View>
            </View>
          </Card>

          {/* Progress Bar - Matching Design */}
          <Card variant="default" padding="md" style={{ marginBottom: 32 }}>
            <Text style={{
              color: BRAND_THEME.colors.gray[600],
              fontSize: 14,
              marginBottom: 8
            }}>
              Progression
            </Text>
            
            <View style={{
              height: 16,
              backgroundColor: BRAND_THEME.colors.gray[100],
              borderRadius: 8,
              overflow: 'hidden',
              flexDirection: 'row',
              marginBottom: 8
            }}>
              <View style={{
                height: '100%',
                backgroundColor: BRAND_THEME.colors.primary[500],
                width: `${(correctNum / totalNum) * 100}%`
              }} />
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{
                color: BRAND_THEME.colors.primary[600],
                fontSize: 14
              }}>
                {correctNum} Correctes
              </Text>
              <Text style={{
                color: BRAND_THEME.colors.gray[500],
                fontSize: 14
              }}>
                {incorrectNum} Incorrectes
              </Text>
            </View>
          </Card>

          {/* Action Buttons - Matching Design */}
          <View style={{ gap: 12 }}>
            <Button 
              title="Pratiquer à nouveau"
              onPress={() => router.back()}
              variant="primary"
              size="lg"
            />

            <TouchableOpacity
              style={{
                paddingVertical: 16,
                alignItems: 'center'
              }}
              onPress={() => router.replace('/(tabs)')}
            >
              <Text style={{
                color: BRAND_THEME.colors.gray[700],
                fontWeight: '600',
                fontSize: 16
              }}>
                Retour à l'accueil
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </>
  )
}

// Stat Item Component - Matching Design
function StatItem({ 
  label, 
  value, 
  icon
}: { 
  label: string
  value: string
  icon: string
}) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ fontSize: 24, marginBottom: 4 }}>{icon}</Text>
      <Text style={{
        fontSize: 18,
        fontWeight: 'bold',
        color: BRAND_THEME.colors.gray[900],
        marginBottom: 2
      }}>
        {value}
      </Text>
      <Text style={{
        color: BRAND_THEME.colors.gray[600],
        fontSize: 12
      }}>
        {label}
      </Text>
    </View>
  )
}
