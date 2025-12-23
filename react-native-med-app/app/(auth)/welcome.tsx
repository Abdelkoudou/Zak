// ============================================================================
// Welcome Screen - Light Sea Green Brand
// ============================================================================

import { View, Text, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Card } from '@/components/ui'
import { BRAND_THEME } from '@/constants/theme'

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 32 }}>
          {/* Logo & Title */}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {/* Brand Logo */}
            <View style={{
              width: 100,
              height: 100,
              backgroundColor: BRAND_THEME.colors.primary[500],
              borderRadius: 28,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
              ...BRAND_THEME.shadows.lg
            }}>
              <Text style={{ color: '#ffffff', fontSize: 48 }}>🩺</Text>
            </View>
            
            <Text style={{
              fontSize: 32,
              fontWeight: 'bold',
              color: BRAND_THEME.colors.gray[900],
              textAlign: 'center',
              marginBottom: 8
            }}>
              MCQ Study App
            </Text>
            
            <Text style={{
              fontSize: 18,
              color: BRAND_THEME.colors.gray[600],
              textAlign: 'center',
              marginBottom: 32
            }}>
              Préparez vos examens médicaux
            </Text>

            <Text style={{
              fontSize: 16,
              color: BRAND_THEME.colors.primary[700],
              textAlign: 'center',
              marginBottom: 32,
              fontWeight: '500'
            }}>
              Curriculum français • Étudiants algériens
            </Text>

            {/* Features */}
            <View style={{ width: '100%', gap: 16, marginBottom: 32 }}>
              <FeatureItem 
                icon="📝" 
                title="QCM par module" 
                description="Questions organisées par année et module d'étude"
              />
              <FeatureItem 
                icon="📊" 
                title="Suivi de progression" 
                description="Statistiques détaillées de vos performances"
              />
              <FeatureItem 
                icon="💾" 
                title="Questions sauvegardées" 
                description="Révisez les questions difficiles plus tard"
              />
              <FeatureItem 
                icon="📁" 
                title="Ressources pédagogiques" 
                description="Accédez aux cours et documents complémentaires"
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ gap: 12 }}>
            <Button 
              title="Créer un compte" 
              onPress={() => router.push('/(auth)/register')}
              variant="primary"
              size="lg"
            />
            
            <Button 
              title="Se connecter" 
              onPress={() => router.push('/(auth)/login')}
              variant="secondary"
              size="lg"
            />
          </View>

          {/* Footer */}
          <Text style={{
            fontSize: 14,
            color: BRAND_THEME.colors.gray[500],
            textAlign: 'center',
            marginTop: 24
          }}>
            Plateforme dédiée aux étudiants en médecine
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

// Enhanced Feature Item Component
function FeatureItem({ icon, title, description }: { 
  icon: string
  title: string
  description: string 
}) {
  return (
    <Card variant="default" padding="md" style={{ backgroundColor: BRAND_THEME.colors.primary[50] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
          width: 48,
          height: 48,
          backgroundColor: BRAND_THEME.colors.primary[100],
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 16
        }}>
          <Text style={{ fontSize: 24 }}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: BRAND_THEME.colors.primary[800],
            marginBottom: 4
          }}>
            {title}
          </Text>
          <Text style={{
            fontSize: 14,
            color: BRAND_THEME.colors.primary[600],
            lineHeight: 20
          }}>
            {description}
          </Text>
        </View>
      </View>
    </Card>
  )
}
