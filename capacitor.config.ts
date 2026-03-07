import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.smartcart',
  appName: 'SmartCart',
  webDir: 'dist',
  server: {
    url: 'https://2f193804-f6e0-42d5-9132-31b050ff764f.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
