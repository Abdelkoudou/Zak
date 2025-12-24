// ============================================================================
// Welcome Screen - Light Sea Green Brand
// ============================================================================

import { View, Text, ScrollView, Image, useWindowDimensions, Platform } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Card } from '@/components/ui'
import { BRAND_THEME } from '@/constants/theme'

// Brand Logo
const Logo = require('@/assets/images/logo.png')

export default function WelcomeScreen() {
  const { width } = useWindowDimensions()
  const isDesktop = width >= 768
  const contentMaxWidth = 800

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }}>
        <View style={{ 
          flex: 1, 
          width: '100%', 
          maxWidth: contentMaxWidth, 
          paddingHorizontal: 24, 
          paddingVertical: 32 
        }}>
          {/* Logo & Title */}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
            {/* Brand Logo */}
            <Image 
              source={Logo}
              style={{
                width: 120,
                height: 120,
                marginBottom: 24,
                resizeMode: 'contain'
              }}
            />
            
            <Text style={{
              fontSize: 32,
              fontWeight: 'bold',
              color: BRAND_THEME.colors.gray[900],
              textAlign: 'center',
              marginBottom: 8
            }}>
              FMC Study App
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
            <View style={{ 
              width: '100%', 
              flexDirection: isDesktop ? 'row' : 'column', 
              flexWrap: 'wrap',
              gap: 16, 
              marginBottom: 32,
              justifyContent: isDesktop ? 'space-between' : 'flex-start'
            }}>
              <View style={{ width: isDesktop ? '48%' : '100%' }}>
                <FeatureItem 
                  icon="📝" 
                  title="FMC par module" 
                  description="Questions organisées par année et module d'étude"
                />
              </View>
              <View style={{ width: isDesktop ? '48%' : '100%' }}>
                <FeatureItem 
                  icon="📊" 
                  title="Suivi de progression" 
                  description="Statistiques détaillées de vos performances"
                />
              </View>
              <View style={{ width: isDesktop ? '48%' : '100%' }}>
                <FeatureItem 
                  icon="💾" 
                  title="Questions sauvegardées" 
                  description="Révisez les questions difficiles plus tard"
                />
              </View>
              <View style={{ width: isDesktop ? '48%' : '100%' }}>
                <FeatureItem 
                  icon="📁" 
                  title="Ressources pédagogiques" 
                  description="Accédez aux cours et documents complémentaires"
                />
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ 
            gap: 12, 
            flexDirection: isDesktop ? 'row' : 'column',
            justifyContent: 'center'
          }}>
            <View style={{ flex: isDesktop ? 1 : 0 }}>
              <Button 
                title="Créer un compte" 
                onPress={() => router.push('/(auth)/register')}
                variant="primary"
                size="lg"
              />
            </View>
            
            <View style={{ flex: isDesktop ? 1 : 0 }}>
              <Button 
                title="Se connecter" 
                onPress={() => router.push('/(auth)/login')}
                variant="secondary"
                size="lg"
              />
            </View>
          </View>

          {/* Footer */}
          <Text style={{
            fontSize: 14,
            color: BRAND_THEME.colors.gray[500],
            textAlign: 'center',
            marginTop: 48
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
