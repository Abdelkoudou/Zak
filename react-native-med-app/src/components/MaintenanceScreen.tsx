import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  useColorScheme,
  Dimensions,
} from "react-native";
import { useEffect, useRef } from "react";

interface MaintenanceScreenProps {
  message?: string;
}

export function MaintenanceScreen({ message }: MaintenanceScreenProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Rotate animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      }),
    ).start();
  }, [pulseAnim, rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const defaultMessage =
    "L'application est en cours de maintenance.\nVeuillez réessayer plus tard.";

  return (
    <View
      style={[
        styles.container,
        isDark ? styles.containerDark : styles.containerLight,
      ]}
    >
      {/* Background gradient effect */}
      <View
        style={[
          styles.gradientOverlay,
          isDark ? styles.gradientDark : styles.gradientLight,
        ]}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Animated gear icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: pulseAnim }, { rotate }],
            },
          ]}
        >
          <Text style={styles.icon}>🔧</Text>
        </Animated.View>

        {/* Title */}
        <Text
          style={[styles.title, isDark ? styles.textDark : styles.textLight]}
        >
          Maintenance en cours
        </Text>

        {/* Message */}
        <Text
          style={[
            styles.message,
            isDark ? styles.messageDark : styles.messageLight,
          ]}
        >
          {message || defaultMessage}
        </Text>

        {/* Status indicator */}
        <View style={styles.statusContainer}>
          <View style={styles.statusDot} />
          <Text
            style={[
              styles.statusText,
              isDark ? styles.messageDark : styles.messageLight,
            ]}
          >
            Nous travaillons pour vous
          </Text>
        </View>

        {/* Bottom text */}
        <Text
          style={[
            styles.bottomText,
            isDark ? styles.messageDark : styles.messageLight,
          ]}
        >
          Merci de votre patience 🙏
        </Text>
      </View>
    </View>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  containerLight: {
    backgroundColor: "#f8fafc",
  },
  containerDark: {
    backgroundColor: "#0f172a",
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
  },
  gradientLight: {
    backgroundColor: "rgba(9, 178, 172, 0.05)",
  },
  gradientDark: {
    backgroundColor: "rgba(9, 178, 172, 0.1)",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(9, 178, 172, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    shadowColor: "#09b2ac",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  icon: {
    fontSize: 56,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  textLight: {
    color: "#1e293b",
  },
  textDark: {
    color: "#f1f5f9",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 320,
  },
  messageLight: {
    color: "#64748b",
  },
  messageDark: {
    color: "#94a3b8",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(9, 178, 172, 0.1)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    marginBottom: 48,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#09b2ac",
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  bottomText: {
    fontSize: 14,
    textAlign: "center",
  },
});

export default MaintenanceScreen;
