export default {
    expo: {
      name: "PrilikaZaTebe",
      slug: "prilikazatebe",
      scheme: "prilikazatebe",
      version: "1.0.0",
      orientation: "portrait",
      platforms: ["ios", "android", "web"],
      entryPoint: "expo-router/entry",
      ios: {
        supportsTablet: true,
      },
      android: {
        adaptiveIcon: {
          foregroundImage: "./assets/adaptive-icon.png",
          backgroundColor: "#FFFFFF",
        },
      },
      web: {
        favicon: "./assets/favicon.png",
      },
    },
  };
  