module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./node_modules'],
          alias: {
            '@react-native/normalize-colors': 'react-native-web/dist/exports/StyleSheet/compiler/normalizeColor.js',
          'react-native': 'react-native-web',
          'react-native-vector-icons': 'react-native-vector-icons',
          '@expo/vector-icons': '@expo/vector-icons',
          // Corrección para Firebase/Hermes
          './src/lib/firebase': './src/lib/firebase.expo.js'
          }
        }
      ],
      'react-native-web'
    ]
  };
};