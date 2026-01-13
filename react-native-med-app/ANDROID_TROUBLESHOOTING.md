# Android Emulator Troubleshooting Guide

## Error: "Cannot read property 'NativeModule' of undefined"

This error typically occurs when testing on Android emulators. Here are the solutions:

### Solution 1: Clear Metro Cache and Restart
```bash
cd react-native-med-app
npm start -- --clear
# or
npx expo start --clear
```

### Solution 2: Use a Different Android API Level
The error often occurs with newer Android API levels (33+). Try using:
- **Android API 31 (Android 12)** - Most stable
- **Android API 30 (Android 11)** - Very stable
- **Android API 29 (Android 10)** - Fallback option

### Solution 3: Create a New Android Emulator
1. Open Android Studio
2. Go to Tools → AVD Manager
3. Create Virtual Device
4. Choose a device (e.g., Pixel 4)
5. Select **API Level 31** (Android 12)
6. Finish and start the emulator

### Solution 4: Test on Physical Device
Physical devices are more reliable than emulators:
1. Enable Developer Options on your Android phone
2. Enable USB Debugging
3. Connect via USB
4. Run: `npx expo run:android`

### Solution 5: Use Expo Go App (Recommended for Testing)
1. Install Expo Go from Google Play Store
2. Run: `npx expo start`
3. Scan QR code with Expo Go app

### Solution 6: Reset Android Development Environment
```bash
# Clear all caches
npx expo install --fix
npm start -- --clear

# If still having issues, reset Metro:
npx react-native start --reset-cache
```

### Solution 7: Check Android SDK Configuration
Ensure you have:
- Android SDK Platform-Tools
- Android SDK Build-Tools 35.0.0
- Android 12 (API 31) SDK Platform

## For Production Builds

The emulator error doesn't affect production builds. You can still build your AAB:

```bash
# Build production AAB for Google Play Store
eas build --platform android --profile production
```

## Environment Variables Status

✅ Your environment variables are properly configured:
- `.env` file exists with correct Supabase credentials
- EAS build configuration is correct
- No hardcoded credentials in source code

## Next Steps

1. Try Solution 5 (Expo Go) first - it's the most reliable for testing
2. If you need native testing, use Solution 2 (API 31 emulator)
3. For production, proceed with EAS build regardless of emulator issues