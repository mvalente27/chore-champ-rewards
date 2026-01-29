import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Must be a valid Java package id for Android/iOS (no segment may start with a number)
  appId: 'com.lovable.chorequest',
  appName: 'ChoreQuest',
  webDir: 'dist',
  server: {
    url: 'https://063c78be-35aa-476f-8604-5287f25be1f2.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
