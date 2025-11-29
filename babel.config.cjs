module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            [
                'module-resolver',
                {
                    root: ['./node_modules'],
                    alias: {
                        // Solo alias necesarios, NO react-native -> react-native-web para nativo
                        '@expo/vector-icons': '@expo/vector-icons',
                        // Corrección para Firebase/Hermes si es necesario
                        './src/lib/firebase': './src/lib/firebase.expo.js'
                    }
                }
            ]
        ]
    };
};
