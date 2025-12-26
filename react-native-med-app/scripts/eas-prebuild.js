#!/usr/bin/env node
/**
 * EAS Prebuild Script
 * Removes react-native-worklets before native builds to avoid compatibility issues
 * This package is only needed for web builds (Vercel)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 EAS Prebuild: Removing react-native-worklets for native build...');

try {
  // Remove the package
  execSync('npm uninstall react-native-worklets --save-dev', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  console.log('✅ Successfully removed react-native-worklets');
} catch (error) {
  // Package might not be installed, that's fine
  console.log('ℹ️  react-native-worklets was not installed or already removed');
}

console.log('🚀 Prebuild complete, continuing with native build...');
