# Web Deployment Guide

Your React Native app is now ready to be deployed as a website! Here are the steps:

## Quick Start

1. **Test locally:**
```bash
npm run web
```

2. **Build for production:**
```bash
npm run build:web
```

3. **Preview the build:**
```bash
npm run preview:web
```

## Deployment Options

### Option 1: Vercel (Recommended)

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel` in the project directory
3. Follow the prompts
4. Your app will be live at the provided URL

### Option 2: Netlify

1. Go to [netlify.com](https://netlify.com)
2. Drag and drop the `dist` folder after running `npm run build:web`
3. Or connect your GitHub repo for automatic deployments

### Option 3: GitHub Pages

1. Build: `npm run build:web`
2. Push the `dist` folder contents to a `gh-pages` branch
3. Enable GitHub Pages in repository settings

### Option 4: Firebase Hosting

1. Install Firebase CLI: `npm i -g firebase-tools`
2. Run: `firebase init hosting`
3. Set public directory to `dist`
4. Build: `npm run build:web`
5. Deploy: `firebase deploy`

## Environment Variables

Make sure to set your environment variables in your hosting platform:
- Supabase URL and keys
- Any other API endpoints

## Notes

- The app uses Expo Router for navigation, which works well on web
- All React Native components are automatically converted to web-compatible versions
- Your existing Supabase integration will work on web
- Mobile-specific features (like device info) may need web alternatives

## Troubleshooting

If you encounter issues:
1. Check browser console for errors
2. Ensure all dependencies support web
3. Test with `npm run web` locally first
4. Check that environment variables are set correctly