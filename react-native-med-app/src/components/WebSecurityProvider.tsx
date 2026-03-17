import React, { useEffect } from "react";
import { Platform, View, Text } from "react-native";
import { useAuth } from "@/context/AuthContext";

/**
 * WebSecurityProvider applies comprehensive friction for Web exports of the application.
 * It strictly disables text selection, context menus, and copy actions.
 * It also overlays a dynamic email watermark, and blurs/blocks the screen upon focus loss.
 */
export function WebSecurityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [isBlurred, setIsBlurred] = React.useState(false);

  useEffect(() => {
    if (Platform.OS !== "web") return;

    // 1. Prevent Focus Loss Snipes (Snipping tool)
    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => setIsBlurred(false);
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true);
      } else {
        setIsBlurred(false);
      }
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 3. Prevent Screenshot Shortcuts (Win+Shift+S, Cmd+Shift+3/4, PrintScreen)
    // Note: This won't stop the OS tool, but it will blur the screen beneath it.
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMacScreenshot =
        e.metaKey &&
        e.shiftKey &&
        (e.key === "3" || e.key === "4" || e.key === "5");
      const isWinScreenshot =
        e.metaKey && e.shiftKey && e.key.toLowerCase() === "s";
      const isPrintScreen = e.key === "PrintScreen";

      if (isMacScreenshot || isWinScreenshot || isPrintScreen) {
        setIsBlurred(true);
        // We set a timeout to unblur because the snip tool pauses JS execution sometimes,
        // or the user might just cancel it. The blur/focus handlers above will also help.
        setTimeout(() => setIsBlurred(false), 3000);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // 2. Prevent Context Menu & Interactions
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleDragStart = (e: DragEvent) => e.preventDefault();
    const handleCopy = (e: ClipboardEvent) => e.preventDefault();
    const handleCut = (e: ClipboardEvent) => e.preventDefault();

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCut);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCut);
    };
  }, []);

  if (Platform.OS !== "web") {
    return <>{children}</>;
  }

  // Generate a pattern for watermarking
  const emailText = "fmc app";
  const watermarkText = Array.from({ length: 50 })
    .map(() => emailText)
    .join("     ");

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Dynamic Watermark Background */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 50, // Over all content
          opacity: 0.04, // Very faint
          overflow: "hidden",
          pointerEvents: "none", // Clicks pass through
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: "#000",
            transform: [{ rotate: "-30deg" }],
            width: "200%",
            height: "200%",
            marginTop: "-50%",
            marginLeft: "-50%",
            lineHeight: 60,
          }}
          selectable={false}
        >
          {watermarkText}
        </Text>
      </View>

      {/* Main Content wrapper */}
      <View
        style={{
          flex: 1,
          opacity: isBlurred ? 0 : 1, // Either blurred/hidden or perfectly visible
          // @ts-ignore - Web-only property to ensure no selection globally
          userSelect: "none",
        }}
      >
        {children}
      </View>

      {/* Focus Loss Overlay */}
      {isBlurred && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.9)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
            Protection Active
          </Text>
        </View>
      )}
    </View>
  );
}
