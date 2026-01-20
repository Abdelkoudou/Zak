import { useEffect, useRef, useState } from 'react'
import { StyleSheet, View, TouchableOpacity, Text, Dimensions } from 'react-native'
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'

interface VideoSplashScreenProps {
  onFinish: () => void
}

export function VideoSplashScreen({ onFinish }: VideoSplashScreenProps) {
  const videoRef = useRef<Video>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Safety timeout: if video fails to load or play within 6 seconds, force finish
  useEffect(() => {
    const timeout = setTimeout(() => {
      handleFinish()
    }, 6000)

    return () => clearTimeout(timeout)
  }, [])

  const handleFinish = async () => {
    try {
      await SplashScreen.hideAsync()
    } catch (e) {
      // Ignore errors if already hidden
    }
    onFinish()
  }

  const handleLoad = async () => {
    setIsLoaded(true)
    // Seamless transition: hide native splash only when video is ready
    try {
      await SplashScreen.hideAsync()
    } catch (e) {
      // Ignore errors
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" hidden />
      <Video
        ref={videoRef}
        style={styles.video}
        source={require('../../assets/logoanimation/logo1_1.mp4')}
        useNativeControls={false}
        resizeMode={ResizeMode.COVER}
        isLooping={false}
        shouldPlay={true}
        isMuted={true}
        onLoad={handleLoad}
        onPlaybackStatusUpdate={(status) => {
          if (status.isLoaded && status.didJustFinish) {
            handleFinish()
          }
        }}
      />
      
     
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Match video background
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
})
