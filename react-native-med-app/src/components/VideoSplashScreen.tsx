import { useEffect, useRef, useCallback } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import { Video, ResizeMode } from "expo-av";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";

interface VideoSplashScreenProps {
  onFinish: () => void;
}

export function VideoSplashScreen({ onFinish }: VideoSplashScreenProps) {
  const videoRef = useRef<Video>(null);

  const handleFinish = useCallback(async () => {
    try {
      await SplashScreen.hideAsync();
    } catch (e) {
      // Ignore errors if already hidden
    }
    onFinish();
  }, [onFinish]);

  // Handle transitions and safety timeout
  useEffect(() => {
    // Hide native splash once the component is mounted to start the animation phase
    SplashScreen.hideAsync().catch(() => {});

    const timeout = setTimeout(() => {
      handleFinish();
    }, 8000);

    return () => clearTimeout(timeout);
  }, [handleFinish]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" hidden />
      <Video
        ref={videoRef}
        style={styles.video}
        source={require("../../assets/logoanimation/logo1_1.mp4")}
        useNativeControls={false}
        resizeMode={ResizeMode.COVER}
        isLooping={false}
        shouldPlay={true}
        isMuted={true}
        onPlaybackStatusUpdate={(status) => {
          if (status.isLoaded && status.didJustFinish) {
            handleFinish();
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  video: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
});
