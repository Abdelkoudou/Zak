import { useEffect, useRef, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Dimensions,
  Image,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";

interface VideoSplashScreenProps {
  onFinish: () => void;
}

export function VideoSplashScreen({ onFinish }: VideoSplashScreenProps) {
  const videoRef = useRef<Video>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleFinish = useCallback(async () => {
    try {
      await SplashScreen.hideAsync();
    } catch (e) {
      // Ignore errors if already hidden
    }
    onFinish();
  }, [onFinish]);

  // Safety timeout: if video fails to load or play within 6 seconds, force finish
  useEffect(() => {
    // Hide native splash screen as soon as this component mounts
    // This allows the container to show up immediately
    SplashScreen.hideAsync().catch(() => {});

    const timeout = setTimeout(() => {
      handleFinish();
    }, 6000);

    return () => clearTimeout(timeout);
  }, [handleFinish]);

  const handleLoad = async () => {
    setIsLoaded(true);
    // Seamless transition: hide native splash only when video is ready
    try {
      await SplashScreen.hideAsync();
    } catch (e) {
      // Ignore errors
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" hidden />
      <Image
        source={require("../../assets/open-screen.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <Video
        ref={videoRef}
        style={styles.video}
        source={require("../../assets/logoanimation/logo1_1.mp4")}
        useNativeControls={false}
        resizeMode={ResizeMode.COVER}
        isLooping={false}
        shouldPlay={true}
        isMuted={true}
        onLoad={handleLoad}
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
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
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
  skipButton: {
    position: "absolute",
    top: 60,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  skipText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
});
