import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Must be a valid Java package id for Android/iOS (no segment may start with a number)
  appId: 'com.lovable.chorequest',
  appName: 'ChoreQuest',
  webDir: 'dist',
  // Remove server.url to load from bundled assets in production
  // The app will use the compiled web assets from the dist folder
};

export default config;
