import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from './supabase';

import { initLocalDb } from './localDb';
import { colors, spacing, radius, fontSize, fontWeight } from './src/constants/theme';
import type { Session, ScreenName, UserRole } from './src/types';

// Screens
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import VpdCalculatorScreen from './screens/VpdCalculatorScreen';
import NutrientCalculatorScreen from './screens/NutrientCalculatorScreen';
import SopLogsScreen from './screens/SopLogsScreen';
import PlantDirectoryScreen from './screens/PlantDirectoryScreen';
import UserManagementScreen from './screens/UserManagementScreen';

function AppContent() {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('OPERATOR');
  const [userFullName, setUserFullName] = useState<string>('Operator');
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);

  const [currentScreen, setCurrentScreen] = useState<ScreenName>('dashboard');
  const [isTh, setIsTh] = useState<boolean>(true);
  const [dbConnected, setDbConnected] = useState<'connected' | 'checking' | 'error'>('checking');
  
  const insets = useSafeAreaInsets();

  const checkConnection = async () => {
    try {
      const { error } = await supabase.from('plants').select('id').limit(1);
      if (error && error.code !== 'PGRST116' && !error.message.includes('does not exist')) {
        setDbConnected('error');
      } else {
        setDbConnected('connected');
      }
    } catch {
      setDbConnected('error');
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role, fullname')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        setUserRole(data.role as UserRole);
        setUserFullName(data.fullname);
      } else {
        // Fallback to user metadata
        const userResult = await supabase.auth.getUser();
        const user = userResult.data.user;
        if (user) {
          setUserRole((user.user_metadata?.role || 'OPERATOR') as UserRole);
          setUserFullName(user.user_metadata?.fullName || 'Operator');
        }
      }
    } catch (err) {
      console.warn('Error fetching profile:', err);
    }
  };

  useEffect(() => {
    const startup = async () => {
      try {
        await initLocalDb(); // Initialize local SQLite cache
      } catch (e) {
        console.warn('Failed to initialize local sqlite:', e);
      }
      await checkConnection();

      // Check active session on startup
      const sessionResult = await supabase.auth.getSession();
      const currentSession = sessionResult.data.session;
      setSession(currentSession);
      if (currentSession) {
        await fetchProfile(currentSession.user.id);
      }
      setLoadingAuth(false);
    };

    startup();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        await fetchProfile(newSession.user.id);
      } else {
        setUserRole('OPERATOR');
        setUserFullName('Operator');
      }
      setLoadingAuth(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLoginSuccess = (newSession: Session, role: string, fullName: string) => {
    setSession(newSession);
    setUserRole(role as UserRole);
    setUserFullName(fullName);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loadingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Initializing APN GACP System...</Text>
      </View>
    );
  }

  // If not authenticated, force Login
  if (!session) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <LoginScreen isTh={isTh} onLoginSuccess={handleLoginSuccess} />
        </View>
      </SafeAreaProvider>
    );
  }

  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <DashboardScreen isTh={isTh} onNavigate={setCurrentScreen} />;
      case 'nutrients':
        return <NutrientCalculatorScreen isTh={isTh} operatorId={session.user.id} />;
      case 'plants_directory':
        return <PlantDirectoryScreen isTh={isTh} operatorId={session.user.id} userRole={userRole} />;
      case 'logs':
        return <SopLogsScreen isTh={isTh} operatorId={session.user.id} userRole={userRole} />;
      case 'vpd':
        return <VpdCalculatorScreen isTh={isTh} />;
      case 'users':
        return <UserManagementScreen isTh={isTh} operatorId={session.user.id} />;
      default:
        return <DashboardScreen isTh={isTh} onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: 0 }]}>
      <StatusBar style="light" />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>P</Text>
          </View>
          <View>
            <Text style={styles.titleText}>PHANNAPHA</Text>
            <Text style={styles.subtitleText}>{userFullName} ({userRole})</Text>
          </View>
          <View style={[
            styles.statusDot, 
            { backgroundColor: dbConnected === 'connected' ? colors.accent : dbConnected === 'error' ? colors.danger : colors.warning }
          ]} />
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.langToggle} onPress={() => setIsTh(!isTh)}>
            <Text style={styles.langToggleText}>{isTh ? 'EN' : 'TH'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
            <Text style={styles.logoutBtnText}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Screen Wrapper */}
      <View style={styles.contentContainer}>
        {renderActiveScreen()}
      </View>

      {/* Bottom Tab Navigation Bar */}
      <View style={[
        styles.tabBar, 
        { 
          paddingBottom: Math.max(insets.bottom, 12), 
          paddingTop: 12 
        }
      ]}>
        <TouchableOpacity 
          style={[styles.tabItem, currentScreen === 'dashboard' && styles.tabItemActive]} 
          onPress={() => setCurrentScreen('dashboard')}
          accessibilityRole="tab"
          accessibilityState={{ selected: currentScreen === 'dashboard' }}
        >
          <Text style={styles.tabIcon}>🏠</Text>
          <Text style={[styles.tabLabel, currentScreen === 'dashboard' && styles.tabLabelActive]}>
            {isTh ? 'แดชบอร์ด' : 'Dashboard'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, currentScreen === 'nutrients' && styles.tabItemActive]} 
          onPress={() => setCurrentScreen('nutrients')}
          accessibilityRole="tab"
          accessibilityState={{ selected: currentScreen === 'nutrients' }}
        >
          <Text style={styles.tabIcon}>🧪</Text>
          <Text style={[styles.tabLabel, currentScreen === 'nutrients' && styles.tabLabelActive]}>
            {isTh ? 'น้ำปุ๋ย' : 'Nutrients'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, currentScreen === 'plants_directory' && styles.tabItemActive]} 
          onPress={() => setCurrentScreen('plants_directory')}
          accessibilityRole="tab"
          accessibilityState={{ selected: currentScreen === 'plants_directory' }}
        >
          <Text style={styles.tabIcon}>🏷️</Text>
          <Text style={[styles.tabLabel, currentScreen === 'plants_directory' && styles.tabLabelActive]}>
            {isTh ? 'ต้นกัญชา' : 'Plants'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, currentScreen === 'logs' && styles.tabItemActive]} 
          onPress={() => setCurrentScreen('logs')}
          accessibilityRole="tab"
          accessibilityState={{ selected: currentScreen === 'logs' }}
        >
          <Text style={styles.tabIcon}>📋</Text>
          <Text style={[styles.tabLabel, currentScreen === 'logs' && styles.tabLabelActive]}>
            {isTh ? 'งาน SOP' : 'SOP Tasks'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, currentScreen === 'vpd' && styles.tabItemActive]} 
          onPress={() => setCurrentScreen('vpd')}
          accessibilityRole="tab"
          accessibilityState={{ selected: currentScreen === 'vpd' }}
        >
          <Text style={styles.tabIcon}>🌡️</Text>
          <Text style={[styles.tabLabel, currentScreen === 'vpd' && styles.tabLabelActive]}>
            {isTh ? 'ค่า VPD' : 'VPD Calc'}
          </Text>
        </TouchableOpacity>

        {userRole === 'ADMIN' && (
          <TouchableOpacity 
            style={[styles.tabItem, currentScreen === 'users' && styles.tabItemActive]} 
            onPress={() => setCurrentScreen('users')}
            accessibilityRole="tab"
            accessibilityState={{ selected: currentScreen === 'users' }}
          >
            <Text style={styles.tabIcon}>👥</Text>
            <Text style={[styles.tabLabel, currentScreen === 'users' && styles.tabLabelActive]}>
              {isTh ? 'ผู้ใช้งาน' : 'Users'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: fontSize.lg,
    marginTop: spacing.md,
    fontWeight: fontWeight.semibold,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'rgba(10, 10, 12, 0.8)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoContainer: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoText: {
    color: colors.textOnAccent,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
  },
  titleText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },
  subtitleText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: spacing.sm,
    alignSelf: 'center',
  },
  langToggle: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: colors.borderLight,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  langToggleText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },
  logoutBtn: {
    backgroundColor: 'rgba(255, 51, 102, 0.1)',
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutBtnText: {
    fontSize: 14,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10, 10, 12, 0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
    flex: 1,
  },
  tabItemActive: {
    opacity: 1,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  tabLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: fontWeight.semibold,
  },
  tabLabelActive: {
    color: colors.accent,
  },
});
