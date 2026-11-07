import React, { useContext } from 'react';
import { enableScreens } from 'react-native-screens';

enableScreens(true);

import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { LogBox, ActivityIndicator, View } from 'react-native';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { AppLockProvider } from './context/AppLockContext';
import { ThemeProvider } from './context/ThemeContext';

// Ignore React Native Web deprecation warnings from React Navigation
LogBox.ignoreLogs([
  'props.pointerEvents is deprecated',
  'Blocked aria-hidden on an element',
]);

// ── Global Root-Cause Fix: Suppress Browser/Native Focus Outline & Ring ───────
import { Platform } from 'react-native';
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleId = 'tushudiary-global-focus-reset';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      input, textarea, select, [contenteditable="true"], [role="textbox"], [data-focusable="true"] {
        outline: none !important;
        outline-style: none !important;
        outline-width: 0 !important;
        outline-color: transparent !important;
        box-shadow: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      input:focus, textarea:focus, select:focus, 
      [contenteditable="true"]:focus, [role="textbox"]:focus, [data-focusable="true"]:focus,
      input:focus-visible, textarea:focus-visible, select:focus-visible, 
      [contenteditable="true"]:focus-visible, [role="textbox"]:focus-visible, [data-focusable="true"]:focus-visible,
      input:active, textarea:active, select:active {
        outline: none !important;
        outline-style: none !important;
        outline-width: 0 !important;
        outline-color: transparent !important;
        box-shadow: none !important;
        -webkit-focus-ring-color: transparent !important;
      }
      *:focus {
        outline: none !important;
      }
      *:focus-visible {
        outline: none !important;
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    } else {
      document.documentElement.appendChild(style);
    }
  }
}


import LoginScreen from './screens/LoginScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import RegisterScreen from './screens/RegisterScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';

// Global UI
import ParticleBackground from './components/ParticleBackground';

// Admin Screens
import AdminDashboard from './screens/admin/AdminDashboard';
import UsersScreen from './screens/admin/UsersScreen';
import AddUserScreen from './screens/admin/AddUserScreen';
import UserDetailsScreen from './screens/admin/UserDetailsScreen';
import EditUserScreen from './screens/admin/EditUserScreen';
import UserRecordsScreen from './screens/admin/UserRecordsScreen';
import AddRecordScreen from './screens/admin/AddRecordScreen';
import RecordDetailsScreen from './screens/admin/RecordDetailsScreen';
import EditRecordScreen from './screens/admin/EditRecordScreen';

// User Screens
import UserTabNavigator from './navigation/UserTabNavigator';


const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false, 
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}


function AppNavigator() {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: 'transparent',
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="auto" />
      <Stack.Navigator 
        screenOptions={{
          headerStyle: { backgroundColor: 'transparent' },
          headerTintColor: '#F0A500',
          headerTitleStyle: { fontWeight: '700', color: '#FFFFFF', fontSize: 16 },
          headerShadowVisible: false,
          headerTransparent: true,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        {user == null ? (
          <Stack.Screen name="AuthStack" component={AuthStack} options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="UserTabNavigator" component={UserTabNavigator} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <ParticleBackground />
      <AuthProvider>
        <ThemeProvider>
          <AppLockProvider>
            <AppNavigator />
          </AppLockProvider>
        </ThemeProvider>
      </AuthProvider>
    </View>
  );
}
