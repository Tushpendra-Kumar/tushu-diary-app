import React, { useContext } from 'react';
import { enableScreens } from 'react-native-screens';

enableScreens(true);

import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { LogBox, ActivityIndicator, View, Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BrandLogo from './components/BrandLogo';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { AppLockProvider } from './context/AppLockContext';
import { ThemeProvider } from './context/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { checkForAppUpdates } from './services/updateService';

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
      :root {
        --ios-bg: #06080D;
        --surface-primary: rgba(17, 21, 30, 0.85);
        --glass-surface: rgba(255, 255, 255, 0.85);
        --glass-surface-dark: rgba(17, 21, 30, 0.85);
        --glass-border: rgba(0, 0, 0, 0.06);
        --glass-border-dark: rgba(255, 255, 255, 0.08);
        --glass-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
        --brand-gold: #F0A500;
        --font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
        --font-card-title: 1.05rem;
        --font-body: 0.88rem;
        --font-secondary: 0.78rem;
        --font-micro: 0.70rem;
        --radius-lg: 18px;
        --touch-target: 44px;
      }
      body, html {
        font-family: var(--font-family) !important;
        -webkit-font-smoothing: antialiased !important;
        -moz-osx-font-smoothing: grayscale !important;
        letter-spacing: -0.012em !important;
      }
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
        contentStyle: { backgroundColor: '#06080D' },
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


class GlobalErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[GlobalErrorBoundary] Caught unhandled React error:', error, errorInfo);
  }

  handleReset = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
    } catch (e) {}
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#050505', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <BrandLogo size={80} style={{ marginBottom: 20 }} />
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 }}>TushuDiary</Text>
          <Text style={{ fontSize: 14, color: '#8E8E93', textAlign: 'center', marginBottom: 24 }}>
            Something went wrong while rendering this view.
          </Text>
          <TouchableOpacity
            onPress={this.handleReset}
            activeOpacity={0.85}
            style={{
              backgroundColor: '#F0A500',
              paddingVertical: 14,
              paddingHorizontal: 28,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: '#000000', fontWeight: '700', fontSize: 15 }}>Reset Session & Return to Login</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

function AppNavigator() {
  // Background check for updates 3.5 seconds after launch (silent unless update available)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      checkForAppUpdates({ showAlert: false }).catch(() => {});
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#050505', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#F0A500" />
      </View>
    );
  }

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#06080D',
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <Stack.Navigator 
        screenOptions={{
          headerStyle: { backgroundColor: '#06080D' },
          headerTintColor: '#F0A500',
          headerTitleStyle: { fontWeight: '700', color: '#FFFFFF', fontSize: 16 },
          headerShadowVisible: false,
                    contentStyle: { backgroundColor: '#06080D' },
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
    <SafeAreaProvider>
      <GlobalErrorBoundary>
        <View style={{ flex: 1, backgroundColor: '#06080D' }}>
          <ParticleBackground />
          <AuthProvider>
            <ThemeProvider>
              <AppLockProvider>
                <AppNavigator />
              </AppLockProvider>
            </ThemeProvider>
          </AuthProvider>
        </View>
      </GlobalErrorBoundary>
    </SafeAreaProvider>
  );
}
