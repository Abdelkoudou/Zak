import { useEffect, useRef, useState, useCallback } from "react";
import { StyleSheet, View, Dimensions, Image } from "react-native";
import { Video, ResizeMode } from "expo-av";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";

interface VideoSplashScreenProps {
  onFinish: () => void;
}

export function VideoSplashScreen({ onFinish }: VideoSplashScreenProps) {
  const videoRef = useRef<Video>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleFinish = useCallback(async () => {
    console.log("[VideoSplash] handleFinish called");
    try {
      await SplashScreen.hideAsync();
    } catch (e) {
      // Ignore errors if already hidden
    }
    onFinish();
  }, [onFinish]);

  // Safety timeout: if video fails to load or play within 8 seconds, force finish
  useEffect(() => {
    console.log("[VideoSplash] Mounted");

    // Attempt to hide native splash so our Image background shows
    const hideNative = async () => {
      try {
        console.log("[VideoSplash] Hiding native splash...");
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn("[VideoSplash] Failed to hide native splash:", e);
      }
    };
    hideNative();

    const timeout = setTimeout(() => {
      console.log("[VideoSplash] Safety timeout reached");
      handleFinish();
    }, 8000);

    return () => clearTimeout(timeout);
  }, [handleFinish]);

  const handleLoad = async () => {
    console.log("[VideoSplash] Video loaded successfully");
    setIsLoaded(true);
  };

  const handleError = (error: string) => {
    console.error("[VideoSplash] Video playback error:", error);
    setHasError(true);
    // On error, let the safety timeout or manual skip handle it
    // Or finish immediately if critical
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" hidden />

      {/* Background Image - Always shown initially */}
      <Image
        source={require("../../assets/open-screen.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
        onLoad={() => console.log("[VideoSplash] Background image loaded")}
        onError={(e) =>
          console.error(
            "[VideoSplash] Background image load error:",
            e.nativeEvent.error,
          )
        }
      />

      {/* Video Animation - Layered on top */}
      <Video
        ref={videoRef}
        style={[
          styles.video,
          { opacity: isLoaded ? 1 : 0 }, // Only show video when it's ready to play
        ]}
        source={require("../../assets/logoanimation/logo1_1.mp4")}
        useNativeControls={false}
        resizeMode={ResizeMode.COVER}
        isLooping={false}
        shouldPlay={true}
        isMuted={true}
        onLoadStart={() => console.log("[VideoSplash] Video load start")}
        onLoad={handleLoad}
        onError={handleError}
        onPlaybackStatusUpdate={(status) => {
          if (status.isLoaded && status.didJustFinish) {
            console.log("[VideoSplash] Video finished playback");
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
    zIndex: 1,
  },
  video: {
    ...StyleSheet.absoluteFillObject,
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
    zIndex: 2,
  },
});
