import React, { useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchUsers } from '../../services/adminApi';
import StatCard from '../../components/StatCard';
import SecurityFooter from '../../components/SecurityFooter';
import { AuthContext } from '../../context/AuthContext';
import { C } from '../../constants/theme';
import { Feather } from '@expo/vector-icons';




export default function AdminDashboard({ navigation }) {
 const { logout, user: authUser } = useContext(AuthContext);
 const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);

 const loadData = async () => {
 setLoading(true);
 setError(null);
 const result = await fetchUsers();
 if (result.success) {
 const users = result.data;
 setStats({
 total: users.length,
 active: users.filter(u => u.status === 'ACTIVE').length,
 inactive: users.filter(u => u.status === 'INACTIVE').length,
 });
 } else {
 setError('Failed to load stats. Pull to refresh.');
 }
 setLoading(false);
 };

 useFocusEffect(useCallback(() => { loadData(); }, []));

 return (
 <ScrollView
 style={styles.container}
 contentContainerStyle={{ paddingBottom: 40 }}
 refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={C.gold} />}
 >
 <StatusBar barStyle="light-content" backgroundColor={C.surface} />

 {/* Header */}
 <View style={styles.header}>
 <View>
 <Text style={styles.brand}>CODEBYTUSHU</Text>
 <Text style={styles.subtitle}>TushuDiary Admin</Text>
 <Text style={styles.appName}>Admin Portal</Text>
 </View>
 <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.7}>
 <Feather name="log-out" style={styles.logoutIcon} />
 </TouchableOpacity>
 </View>

 {/* Greeting */}
 <View style={styles.greetingContainer}>
 <Text style={styles.greeting}>Welcome Back,</Text>
 <Text style={styles.greeting}>
 <Text style={styles.greetingHighlight}>Admin</Text>
 </Text>
 <Text style={styles.greetingSubtext}>Here's your system overview</Text>
 </View>

 {/* Stats */}
 {error ? (
 <Text style={styles.errorText}>{error}</Text>
 ) : (
 <View style={styles.statsGrid}>
 <StatCard title="Total Users" value={stats.total} type="total" />
 <StatCard title="Active" value={stats.active} type="active" />
 <StatCard title="Inactive" value={stats.inactive} type="inactive" />
 </View>
 )}

 {/* Actions */}
 <View style={styles.section}>
 <Text style={styles.sectionTitle}>USER MANAGEMENT</Text>
 <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('UsersScreen')} activeOpacity={0.8}>
 <Feather name="users" style={styles.primaryBtnIcon} />
 <View style={styles.btnTextContainer}>
 <Text style={styles.primaryBtnText}>Manage Users</Text>
 <Text style={styles.primaryBtnSubtext}>View, edit and manage all users</Text>
 </View>
 <Feather name="chevron-right" style={styles.chevron} />
 </TouchableOpacity>
 </View>

 <View style={styles.section}>
 <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
 <TouchableOpacity style={styles.outlineBtn} onPress={() => navigation.navigate('AddUserScreen')} activeOpacity={0.8}>
 <Feather name="user-plus" style={styles.outlineBtnIcon} />
 <View style={styles.btnTextContainer}>
 <Text style={styles.outlineBtnText}>Add New User</Text>
 <Text style={styles.outlineBtnSubtext}>Create a new user account</Text>
 </View>
 <Feather name="chevron-right" style={styles.chevronGold} />
 </TouchableOpacity>
 </View>

 {/* Security Footer */}
 <SecurityFooter />
 </ScrollView>
 );
}

const styles = StyleSheet.create({
 container: { flex: 1, backgroundColor: '#06080D' },
 header: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 backgroundColor: 'rgba(0,0,0,0.4)',
 paddingHorizontal: 24,
 paddingVertical: 24,
 borderBottomWidth: 1,
 borderBottomColor: 'rgba(255, 255, 255, 0.05)',
 },
 brand: { fontSize: 11, color: C.gold, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
 subtitle: { fontSize: 13, color: '#FFFFFF', marginBottom: 2 },
 appName: { fontSize: 22, fontWeight: '700', color: C.white, letterSpacing: -0.4 },
 logoutBtn: {
 backgroundColor: 'rgba(20,20,20,0.8)',
 padding: 14,
 borderRadius: 16,
 borderWidth: 1,
 borderColor: 'rgba(240, 165, 0, 0.3)',
 },
 logoutIcon: { color: C.gold, fontSize: 20 },
 greetingContainer: { padding: 24, paddingTop: 32, paddingBottom: 16 },
 greeting: { fontSize: 32, fontWeight: '800', color: C.white, letterSpacing: -0.5, lineHeight: 38 },
 greetingHighlight: { color: C.gold },
 greetingSubtext: { fontSize: 15, color: '#A0A0A0', marginTop: 12 },
 statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12, marginBottom: 16 },
 section: { paddingHorizontal: 24, marginTop: 32 },
 sectionTitle: {
 fontSize: 12,
 fontWeight: '700',
 color: '#A0A0A0',
 letterSpacing: 2,
 marginBottom: 16,
 },
 primaryBtn: {
 backgroundColor: C.gold,
 paddingVertical: 20,
 paddingHorizontal: 24,
 borderRadius: 20,
 flexDirection: 'row',
 alignItems: 'center',
 boxShadow: '0px 0px 20px rgba(240, 165, 0, 0.4)',
 elevation: 8,
 },
 btnTextContainer: { flex: 1, justifyContent: 'center' },
 primaryBtnIcon: { fontSize: 28, marginRight: 20, color: '#000' },
 primaryBtnText: { color: '#000', fontSize: 18, fontWeight: '800', marginBottom: 2 },
 primaryBtnSubtext: { color: 'rgba(0,0,0,0.6)', fontSize: 13, fontWeight: '600' },
 chevron: { fontSize: 24, color: '#000' },
 outlineBtn: {
 backgroundColor: 'rgba(15,15,15,0.8)',
 paddingVertical: 20,
 paddingHorizontal: 24,
 borderRadius: 20,
 flexDirection: 'row',
 alignItems: 'center',
 borderWidth: 1.5,
 borderColor: 'rgba(240, 165, 0, 0.25)',
 },
 outlineBtnIcon: { fontSize: 28, marginRight: 20, color: C.gold },
 outlineBtnText: { color: C.white, fontSize: 18, fontWeight: '800', marginBottom: 2 },
 outlineBtnSubtext: { color: '#A0A0A0', fontSize: 13, fontWeight: '500' },
 chevronGold: { fontSize: 24, color: C.gold },

 errorText: { color: C.error, textAlign: 'center', margin: 24, fontWeight: '500' },
});
