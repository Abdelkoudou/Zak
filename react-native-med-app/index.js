// ============================================================================
// Custom Entry Point - Load polyfills BEFORE expo-router
// ============================================================================
// This file wraps the standard expo-router/entry to inject polyfills first.
// The polyfill must run before any module that uses setImmediate.
// ============================================================================

// Step 1: Polyfill setImmediate for Hermes (MUST BE FIRST)
if (typeof global.setImmediate === "undefined") {
  // @ts-ignore
  global.setImmediate = (callback, ...args) =>
    setTimeout(() => callback(...args), 0);
}
if (typeof global.clearImmediate === "undefined") {
  // @ts-ignore
  global.clearImmediate = (id) => clearTimeout(id);
}

// Step 2: Now load expo-router (which loads all other modules)
import "expo-router/entry";
