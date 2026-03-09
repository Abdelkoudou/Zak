import React, { useRef, useEffect, useState } from "react";
import { View, LayoutChangeEvent, TextProps } from "react-native";

interface SecureTextElementProps extends TextProps {
  children: React.ReactNode;
}

/**
 * Renders text on an HTML5 canvas specifically for the web to prevent
 * DOM scraping and text selection/copying.
 */
export function SecureTextElement(props: SecureTextElementProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Extract simple string from children (React occasionally passes arrays of strings)
  const textContent = Array.isArray(props.children)
    ? props.children.join("")
    : String(props.children || "");

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Extract styles (fallback to sensible defaults)
  const styleObj: any = props.style
    ? Array.isArray(props.style)
      ? Object.assign({}, ...props.style)
      : props.style
    : {};
  const fontSize = styleObj.fontSize || 16;
  const fontFamily = styleObj.fontFamily || "Inter_400Regular, sans-serif";
  const color = styleObj.color || "#333333";
  const lineHeight = styleObj.lineHeight || fontSize * 1.5;

  // Simple text wrapping algorithm for Canvas 2D
  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
  ) => {
    // Basic newline split support
    const manualLines = text.split("\n");
    let finalLines: string[] = [];

    manualLines.forEach((manualLine) => {
      const words = manualLine.split(" ");
      let currentLine = "";

      for (let n = 0; n < words.length; n++) {
        const testLine = currentLine + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth && n > 0) {
          finalLines.push(currentLine);
          currentLine = words[n] + " ";
        } else {
          currentLine = testLine;
        }
      }
      finalLines.push(currentLine);
    });

    return finalLines;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0 || !textContent) return;

    // Scale for high DPI displays to keep text sharp
    const dpr = window.devicePixelRatio || 1;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set font once to measure correctly
    ctx.font = `${styleObj.fontWeight || "normal"} ${fontSize}px ${fontFamily}`;

    // Calculate required height based on wrapped text
    const lines = wrapText(ctx, textContent, dimensions.width);
    const calculatedHeight = lines.length * lineHeight;

    // Re-adjust dimension height if it changed this render cycle
    if (Math.abs(calculatedHeight - dimensions.height) > 1) {
      // Break out of current render frame to update height
      setTimeout(
        () => setDimensions((prev) => ({ ...prev, height: calculatedHeight })),
        0,
      );
      return;
    }

    // Set actual canvas size and scale CSS size
    canvas.width = dimensions.width * dpr;
    canvas.height = calculatedHeight * dpr;
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${calculatedHeight}px`;

    // Normalize coordinate system to use css pixels
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, dimensions.width, calculatedHeight);
    ctx.font = `${styleObj.fontWeight || "normal"} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textBaseline = "top";

    // Draw wrapped lines
    lines.forEach((lineText, i) => {
      // Optional: basic RTL support can be added if needed: ctx.direction = 'rtl';
      ctx.fillText(
        lineText.trimEnd(),
        0,
        i * lineHeight + (lineHeight - fontSize) / 2,
      );
    });
  }, [
    textContent,
    dimensions.width,
    dimensions.height,
    fontSize,
    fontFamily,
    color,
    lineHeight,
    styleObj.fontWeight,
  ]);

  return (
    <View
      style={[
        props.style as any,
        // Force the outer container to match the canvas height, removing text properties that might bleed
        {
          height: dimensions.height || "auto",
          flex: undefined,
          overflow: "hidden",
        },
      ]}
      onLayout={(e: LayoutChangeEvent) => {
        // Only update if the width significantly changed to prevent infinite loops
        if (Math.abs(e.nativeEvent.layout.width - dimensions.width) > 1) {
          setDimensions((prev) => ({
            ...prev,
            width: e.nativeEvent.layout.width,
          }));
        }
      }}
    >
      {/* Hide element from selection, DevTools string search, right click */}
      <canvas
        //@ts-ignore - React Native Web supports the raw canvas element if explicitly casted
        ref={canvasRef}
        style={{ display: "block", outline: "none", userSelect: "none" }}
        onContextMenu={(e) => e.preventDefault()}
      />
    </View>
  );
}
