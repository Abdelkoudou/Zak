import React from "react";
import { Text, TextProps } from "react-native";

/**
 * On native platforms, memory scraping is extremely difficult and we already
 * use OS-level screenshot blocking (FLAG_SECURE/ScreenCapture).
 * So we just render standard Text.
 */
export function SecureTextElement(props: TextProps) {
  return <Text {...props} />;
}
