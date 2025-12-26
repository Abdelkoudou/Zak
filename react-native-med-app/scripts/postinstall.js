#!/usr/bin/env node
/**
 * Postinstall Script
 * Removes react-native-worklets during EAS builds (native) but keeps it for web builds (Vercel)
 * 
 * Detection:
 * - EAS_BUILD=true means we're in EAS Build environment (native)
 * - VERCEL=1 means we're in Vercel environment (web)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const isEASBuild = process.env.EAS_BUILD === 'true';
const isVercel = process.env.VERCEL === '1';

console.log('📦 Postinstall script running...');
console.log(`   EAS_BUILD: ${isEASBuild}`);
console.log(`   VERCEL: ${isVercel}`);

if (isEASBuild) {
  console.log('🔧 EAS Build detected - removing react-native-worklets for native build compatibility...');
  
  try {
    // Check if the package exists in node_modules
    const workletsPath = path.join(__dirname, '..', 'node_modules', 'react-native-worklets');
    
    if (fs.existsSync(workletsPath)) {
      // Remove the directory
      fs.rmSync(workletsPath, { recursive: true, force: true });
      console.log('✅ Successfully removed react-native-worklets from node_modules');
    } else {
      console.log('ℹ️  react-native-worklets not found in node_modules');
    }
  } catch (error) {
    console.log('⚠️  Could not remove react-native-worklets:', error.message);
  }
} else if (isVercel) {
  console.log('🌐 Vercel build detected - keeping react-native-worklets for web build');
} else {
  console.log('💻 Local development - no changes needed');
}

console.log('✅ Postinstall complete');
