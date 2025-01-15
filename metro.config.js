const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

// Define the project root (current folder where the app resides)
const projectRoot = __dirname;

// Get the default configuration from Expo
const defaultConfig = getDefaultConfig(projectRoot);

// Modify the default configuration
defaultConfig.watchFolders = [projectRoot]; // 1. Watch only the project folder
defaultConfig.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
]; // 2. Resolve dependencies from the project folder only

defaultConfig.resolver.disableHierarchicalLookup = true; // 3. Disable hierarchical lookup

// Export the modified configuration
module.exports = defaultConfig;
