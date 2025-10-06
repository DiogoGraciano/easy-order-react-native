import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { store } from '../store/store';
import { AuthProvider } from '../components/AuthProvider';
import { AuthGuard } from '../components/AuthGuard';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <Provider store={store}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <AuthGuard>
            <Stack>
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
              <Stack.Screen name="customers/new" options={{ headerShown: false }} />
              <Stack.Screen name="enterprises/new" options={{ headerShown: false }} />
              <Stack.Screen name="products/new" options={{ headerShown: false }} />
              <Stack.Screen name="orders/new" options={{ headerShown: false }} />
              <Stack.Screen name="customers/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="enterprises/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="products/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="orders/[id]" options={{ headerShown: false }} />
            </Stack>
          </AuthGuard>
        </AuthProvider>
        <StatusBar style="auto" />
      </ThemeProvider>
    </Provider>
  );
}
