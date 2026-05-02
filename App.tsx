/**
 * P2P Lending App
 * React Native Application
 */

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { store } from './src/store';
import { AppNavigator } from './src/navigation';
import { ThemeProvider, ToastProvider } from './src/providers';
import { Web3Provider } from '@/providers/Web3Provider';

// Error Boundary to catch and display runtime errors on screen
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🔴 App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>⚠️ App Error</Text>
          <ScrollView style={errorStyles.scroll}>
            <Text style={errorStyles.message}>
              {this.state.error?.message || 'Unknown error'}
            </Text>
            <Text style={errorStyles.stack}>
              {this.state.error?.stack || ''}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    color: '#ff6b6b',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  scroll: {
    flex: 1,
  },
  message: {
    color: '#ffd93d',
    fontSize: 16,
    marginBottom: 12,
  },
  stack: {
    color: '#a0a0a0',
    fontSize: 12,
    fontFamily: 'monospace',
  },
});

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <Web3Provider>
              <ThemeProvider>
                <ToastProvider>
                  <AppNavigator />
                </ToastProvider>
              </ThemeProvider>
            </Web3Provider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
