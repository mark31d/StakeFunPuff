// App.js — entry point for Jokes Huff and Fun Puff
import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Loader                 from './Components/Loader';
import Onboarding             from './Components/Onboarding';

import HomeScreen             from './Components/HomeScreen';
import SavedScreen            from './Components/SavedScreen';
import JournalScreen          from './Components/JournalScreen';
import { SavedProvider }      from './Components/SavedContext';

import { 
  GameSetupScreen, 
  GameCountdownScreen, 
  GameScreen, 
  GameResultsScreen 
} from './Components/GameScreens';

const Stack = createNativeStackNavigator();

function LoaderScreen({ navigation }) {
  return (
    <Loader
      delay={2000}
      fadeMs={300}
      onFinish={() => navigation.replace('Onboarding')}
    />
  );
}

export default function App() {
  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#0a1826',
      card: '#0a1826',
      text: '#ffffff',
      primary: '#39e6b7',
      border: '#0a1826',
    },
  };

  return (
    <SafeAreaProvider>
      <SavedProvider>
        <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />
        <NavigationContainer theme={theme}>
          <Stack.Navigator
            initialRouteName="Loader"
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              contentStyle: { backgroundColor: '#0a1826' },
              gestureEnabled: true,
            }}
          >
            <Stack.Screen name="Loader" component={LoaderScreen} options={{ gestureEnabled: false }} />
            <Stack.Screen name="Onboarding" component={Onboarding} options={{ gestureEnabled: false }} />

            <Stack.Screen name="Home"                component={HomeScreen} />
            <Stack.Screen name="Saved"               component={SavedScreen} />
            <Stack.Screen name="Journal"             component={JournalScreen} />

            <Stack.Screen name="GameSetup"           component={GameSetupScreen} />
            <Stack.Screen name="GameCountdown"       component={GameCountdownScreen} />
            <Stack.Screen name="Game"                component={GameScreen} />
            <Stack.Screen name="GameResults"         component={GameResultsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SavedProvider>
    </SafeAreaProvider>
  );
}
