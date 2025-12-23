// ============================================================================
// Brand Showcase Component - Light Sea Green Demo
// ============================================================================

import React from 'react'
import { View, Text, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Card, Input, Badge, LoadingSpinner, Alert } from '@/components/ui'
import { BRAND_THEME } from '@/constants/theme'

export const BrandShowcase: React.FC = () => {
  const [inputValue, setInputValue] = React.useState('')

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 28, 
            fontWeight: 'bold', 
            color: BRAND_THEME.colors.primary[800],
            marginBottom: 8 
          }}>
            Light Sea Green Brand
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: BRAND_THEME.colors.gray[600] 
          }}>
            MCQ Study App - Brand Identity Showcase
          </Text>
        </View>

        {/* Color Palette */}
        <Card style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '600', 
            marginBottom: 16,
            color: BRAND_THEME.colors.gray[800]
          }}>
            Color Palette
          </Text>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(BRAND_THEME.colors.primary).map(([shade, color]) => (
              <View key={shade} style={{ alignItems: 'center', marginBottom: 12 }}>
                <View style={{
                  width: 40,
                  height: 40,
                  backgroundColor: color,
                  borderRadius: 8,
                  marginBottom: 4,
                  borderWidth: 1,
                  borderColor: BRAND_THEME.colors.gray[200]
                }} />
                <Text style={{ 
                  fontSize: 12, 
                  color: BRAND_THEME.colors.gray[600],
                  textAlign: 'center'
                }}>
                  {shade}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Buttons */}
        <Card style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '600', 
            marginBottom: 16,
            color: BRAND_THEME.colors.gray[800]
          }}>
            Buttons
          </Text>
          
          <View style={{ gap: 12 }}>
            <Button title="Primary Button" onPress={() => {}} variant="primary" />
            <Button title="Secondary Button" onPress={() => {}} variant="secondary" />
            <Button title="Outline Button" onPress={() => {}} variant="outline" />
            <Button title="Ghost Button" onPress={() => {}} variant="ghost" />
            <Button title="Loading Button" onPress={() => {}} loading />
            <Button title="Disabled Button" onPress={() => {}} disabled />
          </View>
        </Card>

        {/* Input Fields */}
        <Card style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '600', 
            marginBottom: 16,
            color: BRAND_THEME.colors.gray[800]
          }}>
            Input Fields
          </Text>
          
          <Input
            label="Email"
            placeholder="votre@email.com"
            value={inputValue}
            onChangeText={setInputValue}
          />
          
          <Input
            label="Mot de passe"
            placeholder="••••••••"
            value=""
            onChangeText={() => {}}
            secureTextEntry
          />
          
          <Input
            label="Message"
            placeholder="Votre message..."
            value=""
            onChangeText={() => {}}
            multiline
            numberOfLines={3}
          />
        </Card>

        {/* Badges */}
        <Card style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '600', 
            marginBottom: 16,
            color: BRAND_THEME.colors.gray[800]
          }}>
            Badges
          </Text>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Badge label="Primary" variant="primary" />
            <Badge label="Secondary" variant="secondary" />
            <Badge label="Success" variant="success" />
            <Badge label="Error" variant="error" />
            <Badge label="Warning" variant="warning" />
            <Badge label="Gray" variant="gray" />
          </View>
        </Card>

        {/* Alerts */}
        <Card style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '600', 
            marginBottom: 16,
            color: BRAND_THEME.colors.gray[800]
          }}>
            Alerts
          </Text>
          
          <View style={{ gap: 12 }}>
            <Alert 
              title="Information"
              message="Ceci est un message d'information avec la couleur primaire."
              variant="info"
            />
            <Alert 
              title="Succès"
              message="Votre action a été effectuée avec succès."
              variant="success"
            />
            <Alert 
              title="Attention"
              message="Veuillez vérifier vos informations."
              variant="warning"
            />
            <Alert 
              title="Erreur"
              message="Une erreur s'est produite lors du traitement."
              variant="error"
            />
          </View>
        </Card>

        {/* Loading States */}
        <Card style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '600', 
            marginBottom: 16,
            color: BRAND_THEME.colors.gray[800]
          }}>
            Loading States
          </Text>
          
          <LoadingSpinner message="Chargement en cours..." />
        </Card>

        {/* Medical Module Examples */}
        <Card style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '600', 
            marginBottom: 16,
            color: BRAND_THEME.colors.gray[800]
          }}>
            Module Types (Medical Context)
          </Text>
          
          <View style={{ gap: 12 }}>
            <View className="bg-primary-100 p-4 rounded-xl">
              <Text className="text-primary-700 font-semibold">Module Annuel</Text>
              <Text className="text-primary-600 text-sm">Anatomie, Biochimie</Text>
            </View>
            
            <View className="bg-primary-200 p-4 rounded-xl">
              <Text className="text-primary-800 font-semibold">Module Semestriel</Text>
              <Text className="text-primary-700 text-sm">Embryologie, Histologie</Text>
            </View>
            
            <View className="bg-primary-300 p-4 rounded-xl">
              <Text className="text-primary-900 font-semibold">U.E.I</Text>
              <Text className="text-primary-800 text-sm">Unités d'Enseignement Intégrées</Text>
            </View>
            
            <View className="bg-primary-400 p-4 rounded-xl">
              <Text className="text-white font-semibold">Module Autonome</Text>
              <Text className="text-primary-100 text-sm">Génétique, Immunologie</Text>
            </View>
          </View>
        </Card>

        {/* Brand Identity Summary */}
        <Card variant="elevated" style={{ marginBottom: 32 }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '600', 
            marginBottom: 16,
            color: BRAND_THEME.colors.primary[800]
          }}>
            Brand Identity
          </Text>
          
          <Text style={{ 
            fontSize: 14, 
            color: BRAND_THEME.colors.gray[600],
            lineHeight: 20,
            marginBottom: 12
          }}>
            <Text style={{ fontWeight: '600' }}>Primary Color:</Text> Light Sea Green (#14b8a6)
          </Text>
          
          <Text style={{ 
            fontSize: 14, 
            color: BRAND_THEME.colors.gray[600],
            lineHeight: 20,
            marginBottom: 12
          }}>
            <Text style={{ fontWeight: '600' }}>Use Case:</Text> Medical exam preparation app for Algerian students
          </Text>
          
          <Text style={{ 
            fontSize: 14, 
            color: BRAND_THEME.colors.gray[600],
            lineHeight: 20
          }}>
            <Text style={{ fontWeight: '600' }}>Design System:</Text> Clean, professional, accessible with consistent spacing and typography
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  )
}