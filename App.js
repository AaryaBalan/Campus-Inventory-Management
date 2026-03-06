import 'react-native-gesture-handler';
import React from 'react';
import { LogBox, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { AppProvider } from './src/context/AppContext';
import RootNavigator from './src/navigation/RootNavigator';

LogBox.ignoreLogs([
  'AsyncStorage has been extracted',
  'Non-serializable values were found',
  'shadow* style props are deprecated',
]);

// Suppress non-critical React Native Web warnings for cleaner demo
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (args[0] && typeof args[0] === 'string' && (
      args[0].includes('pointerEvents is deprecated') ||
      args[0].includes('Unknown event handler property') ||
      args[0].includes('TouchableMixin is deprecated')
    )) return;
    originalWarn(...args);
  };
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#0B1120" />
        <AuthProvider>
          <AppProvider>
            <RootNavigator />
          </AppProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B1120' },
});
