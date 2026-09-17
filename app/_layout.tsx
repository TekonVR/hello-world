import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { StoreProvider } from '../src/state/store';
import { colours } from '../src/ui/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colours.bg },
            animation: 'fade',
          }}
        >
          {/* The sprint owns the screen: no header, no way back to the home card. */}
          <Stack.Screen name="sprint" options={{ gestureEnabled: false }} />
        </Stack>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
