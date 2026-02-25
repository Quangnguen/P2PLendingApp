/**
 * P2P Lending App
 * React Native Application
 */

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { store } from './src/store';
import { AppNavigator } from './src/navigation';
import { ThemeProvider, ToastProvider } from './src/providers';
import { Web3Provider } from '@/providers/Web3Provider';

const App: React.FC = () => {
  return (
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
  );
};

export default App;
