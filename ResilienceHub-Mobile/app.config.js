const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = process.env.REPL_SLUG ? null : getLocalIP();

module.exports = {
  expo: {
    name: "ResilienceHub Mobile",
    slug: "resiliencehub-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#3B82F6"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.anonymous.resiliencehubmobile"
    },
    android: {
      package: "com.anonymous.resiliencehubmobile",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#3B82F6"
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: "4b3322ab-b623-40a8-a80a-8a31074ca677"
      },
      apiBaseUrl: process.env.EXPO_PUBLIC_API_URL || (process.env.REPL_SLUG
        ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
        : `http://${localIP}:5005`)
    }
  }
};