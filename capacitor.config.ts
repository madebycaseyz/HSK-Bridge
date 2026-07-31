import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.madebycaseyz.hskbridge',
  appName: 'HSK Deck',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
