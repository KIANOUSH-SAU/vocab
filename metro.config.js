const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')
const escape = require('escape-string-regexp')
const exclusionList = require('metro-config/src/defaults/exclusionList')

const config = getDefaultConfig(__dirname)

// react-native-appwrite ships a nested copy of react-native that uses
// experimental syntax (e.g. `match (mode)`) the project's Babel can't parse.
// Block the nested copy and pin every `react-native` import to the root one.
const nestedRN = path.resolve(
  __dirname,
  'node_modules/react-native-appwrite/node_modules/react-native',
)

config.resolver.blockList = exclusionList([
  new RegExp(`^${escape(nestedRN)}\\/.*$`),
])

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  'react-native': path.resolve(__dirname, 'node_modules/react-native'),
}

module.exports = config
