import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Switch, Alert, Modal, ActivityIndicator, Platform } from 'react-native';
import { C } from '../../../constants/theme';
import { ChevronLeft, Cloud, CloudOff, HardDrive, History, UploadCloud, DownloadCloud, Trash2, CheckCircle, RefreshCcw, FileJson, Info } from 'lucide-react-native';
import { AuthContext } from '../../../context/AuthContext';
import ParticleBackground from '../../../components/ParticleBackground';
import SecurityFooter from '../../../components/SecurityFooter';
import { 
    fetchAvailableDataScopes, 
    getBackupHistory, 
    createLocalBackup, 
    restoreLocalBackup, 
    exportBackupToFile,
    deleteBackup 
} from '../../../services/backupService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdvancedBackupSyncScreen({ navigation }) {
    const { user } = useContext(AuthContext);
    
    const [history, setHistory] = useState([]);
    const [scopes, setScopes] = useState([]);
    const [selectedScopes, setSelectedScopes] = useState([]);
    
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    
    // Auto backup fake state
    const [autoBackup, setAutoBackup] = useState(false);
    const [backupFreq, setBackupFreq] = useState('Manual'); // Daily, Weekly, Manual
    
    // Modals
    const [scopeModal, setScopeModal] = useState(false);
    const [historyModal, setHistoryModal] = useState(false);
    
    useEffect(() => {
        const available = fetchAvailableDataScopes();
        setScopes(available);
        loadHistory();
        loadPreferences(available);
    }, []);
    
    const loadPreferences = async (available) => {
        try {
            const prefs = await AsyncStorage.getItem(`tushu_backup_prefs_${user?.user_id}`);
            if (prefs) {
                const parsed = JSON.parse(prefs);
                setAutoBackup(parsed.autoBackup ?? false);
                setBackupFreq(parsed.backupFreq ?? 'Manual');
                if (parsed.selectedScopes && Array.isArray(parsed.selectedScopes)) {
                    const validIds = (available || fetchAvailableDataScopes()).map(s => s.id);
                    const valid = parsed.selectedScopes.filter(id => validIds.includes(id));
                    setSelectedScopes(valid.length > 0 ? valid : validIds);
                } else {
                    setSelectedScopes((available || fetchAvailableDataScopes()).map(s => s.id));
                }
            } else {
                setSelectedScopes((available || fetchAvailableDataScopes()).map(s => s.id));
            }
        } catch(e) {
            setSelectedScopes((available || fetchAvailableDataScopes()).map(s => s.id));
        }
    };

    const savePreferences = async (newPrefs) => {
        try {
            await AsyncStorage.setItem(`tushu_backup_prefs_${user?.user_id}`, JSON.stringify(newPrefs));
        } catch(e) {}
    };

    const loadHistory = async () => {
        if (user?.user_id) {
            const h = await getBackupHistory(user.user_id);
            setHistory(h);
        }
    };

    const handleBackupNow = async () => {
        if (selectedScopes.length === 0) {
            if (Platform.OS === 'web') {
                window.alert('Select Data\n\nPlease select at least one data category to backup.');
            } else {
                Alert.alert("Select Data", "Please select at least one data category to backup.");
            }
            return;
        }
        setIsBackingUp(true);
        try {
            await createLocalBackup(user.user_id, selectedScopes);
            await loadHistory();
            if (Platform.OS === 'web') {
                window.alert('Backup Successful\n\nYour data backup has been created securely.');
            } else {
                Alert.alert("Backup Successful", "Your local data backup has been created securely.");
            }
        } catch (error) {
            console.error('[Backup] Backup failed:', error);
            if (Platform.OS === 'web') {
                window.alert('Backup Failed\n\nAn error occurred: ' + (error.message || 'Unknown error.'));
            } else {
                Alert.alert("Backup Failed", "An error occurred while creating the backup.");
            }
        } finally {
            setIsBackingUp(false);
        }
    };

    const handleSyncNow = () => {
        if (Platform.OS === 'web') {
            window.alert('Cloud Setup Required\n\nCurrently, there is no active cloud backend configuration for this account to perform real-time synchronization. Please use local Backup & Restore for offline preservation until Cloud is provisioned.');
            return;
        }
        Alert.alert(
            "Cloud Setup Required", 
            "Currently, there is no active cloud backend configuration for this account to perform real-time synchronization. \n\nPlease use local Backup & Restore for offline preservation until Cloud is provisioned.",
            [{ text: "OK", style: "cancel" }]
        );
    };

    const handleRestore = (backupId) => {
        if (Platform.OS === 'web') {
            if (window.confirm('Restore Backup\n\nRestoring a backup will replace your current active data for the included categories. A safety snapshot will be created before restoring.\n\nContinue?')) {
                restoreLocalBackup(user.user_id, backupId).then(() => {
                    Alert.alert("Restore Complete", "Data has been successfully restored.");
                    loadHistory();
                }).catch(e => {
                    Alert.alert("Restore Failed", "Failed to restore backup data.");
                });
            }
            return;
        }
        Alert.alert(
            "Restore Backup",
            "Restoring a backup will replace your current active data for the included categories. A safety snapshot will be created before restoring.\n\nContinue?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Continue", style: "destructive", onPress: async () => {
                    try {
                        await restoreLocalBackup(user.user_id, backupId);
                        Alert.alert("Restore Complete", "Data has been successfully restored.");
                        loadHistory();
                    } catch(e) {
                        Alert.alert("Restore Failed", "Failed to restore backup data.");
                    }
                }}
            ]
        );
    };

    const handleDeleteBackup = (backupId) => {
        if (Platform.OS === 'web') {
            if (window.confirm('Delete this backup?\n\nThis backup will be permanently removed from backup history.')) {
                deleteBackup(user.user_id, backupId).then(() => loadHistory());
            }
            return;
        }
        Alert.alert(
            "Delete this backup?",
            "This backup will be permanently removed from backup history.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: async () => {
                    await deleteBackup(user.user_id, backupId);
                    loadHistory();
                }}
            ]
        );
    };

    const handleExportBackup = async (backupId) => {
        try {
            await exportBackupToFile(user.user_id, backupId);
        } catch (e) {
            Alert.alert("Export Failed", "Could not export backup file.");
        }
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (ts) => {
        const d = new Date(ts);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
    };

    const isBackedUp = history.length > 0;
    const lastBackup = isBackedUp ? history[0] : null;

    return (
        <SafeAreaView style={s.safe}>
            <ParticleBackground />
            
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                    <ChevronLeft color={C.white} size={28} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Advanced Backup & Sync</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={s.scroll}>
                
                {/* STATUS DASHBOARD */}
                <View style={s.statusCard}>
                    <View style={s.statusRow}>
                        <View style={s.statusIconWrap}>
                            {isBackedUp ? <CheckCircle color="#4CAF50" size={24} /> : <HardDrive color={C.textMuted} size={24} />}
                        </View>
                        <View style={s.statusTextWrap}>
                            <Text style={s.statusLabel}>Backup Status</Text>
                            <Text style={[s.statusValue, { color: isBackedUp ? '#4CAF50' : C.textMuted }]}>
                                {isBackedUp ? 'Backed Up' : 'Not Backed Up'}
                            </Text>
                        </View>
                    </View>
                    
                    <View style={s.statusDivider} />

                    <View style={s.statusRow}>
                        <View style={s.statusIconWrap}>
                            <CloudOff color="#F44336" size={24} />
                        </View>
                        <View style={s.statusTextWrap}>
                            <Text style={s.statusLabel}>Sync Status</Text>
                            <Text style={[s.statusValue, { color: '#F44336' }]}>Not Connected</Text>
                        </View>
                    </View>

                    <View style={s.statusDivider} />

                    <View style={s.statusDetailRow}>
                        <Text style={s.statusDetailLabel}>Last Local Backup:</Text>
                        <Text style={s.statusDetailValue}>{lastBackup ? formatDate(lastBackup.timestamp) : 'Never'}</Text>
                    </View>
                    <View style={s.statusDetailRow}>
                        <Text style={s.statusDetailLabel}>Storage Usage:</Text>
                        <Text style={s.statusDetailValue}>{lastBackup ? formatBytes(lastBackup.sizeBytes) : '0 B'}</Text>
                    </View>
                </View>

                {/* PRIMARY ACTIONS */}
                <View style={s.actionRow}>
                    <TouchableOpacity 
                        style={[s.actionBtn, { backgroundColor: C.gold }]} 
                        onPress={handleBackupNow}
                        disabled={isBackingUp}
                    >
                        {isBackingUp ? (
                            <ActivityIndicator color={C.black} size="small" />
                        ) : (
                            <>
                                <HardDrive color={C.black} size={20} />
                                <Text style={[s.actionBtnText, { color: C.black }]}>Backup Now</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={s.actionBtnSec} onPress={handleSyncNow}>
                        <RefreshCcw color={C.white} size={20} />
                        <Text style={s.actionBtnTextSec}>Sync Now</Text>
                    </TouchableOpacity>
                </View>

                {/* SETTINGS GROUP */}
                <Text style={s.sectionTitle}>BACKUP SETTINGS</Text>
                
                <View style={s.settingGroup}>
                    {/* Select Data */}
                    <TouchableOpacity style={s.settingRow} onPress={() => setScopeModal(true)}>
                        <View style={s.settingIconBg}><History size={20} color={C.gold} /></View>
                        <View style={s.settingTextWrap}>
                            <Text style={s.settingLabel}>Select Backup Data</Text>
                            <Text style={s.settingDesc}>{selectedScopes.length} of {scopes.length} modules selected</Text>
                        </View>
                        <ChevronLeft style={{ transform: [{rotate: '180deg'}] }} color={C.textMuted} size={20} />
                    </TouchableOpacity>
                    
                    {/* Backup History */}
                    <TouchableOpacity style={s.settingRow} onPress={() => setHistoryModal(true)}>
                        <View style={s.settingIconBg}><FileJson size={20} color={C.gold} /></View>
                        <View style={s.settingTextWrap}>
                            <Text style={s.settingLabel}>Backup History & Restore</Text>
                            <Text style={s.settingDesc}>{history.length} available local backups</Text>
                        </View>
                        <ChevronLeft style={{ transform: [{rotate: '180deg'}] }} color={C.textMuted} size={20} />
                    </TouchableOpacity>
                </View>

                <Text style={s.sectionTitle}>CLOUD AUTOMATION</Text>
                
                <View style={s.settingGroup}>
                    <View style={s.settingRow}>
                        <View style={s.settingIconBg}><Cloud size={20} color={C.gold} /></View>
                        <View style={s.settingTextWrap}>
                            <Text style={s.settingLabel}>Automatic Cloud Backup</Text>
                            <Text style={s.settingDesc}>Cloud backend setup required</Text>
                        </View>
                        <Switch 
                            trackColor={{ false: '#333', true: C.gold }}
                            thumbColor={C.white}
                            value={autoBackup}
                            onValueChange={(val) => {
                                setAutoBackup(val);
                                savePreferences({ autoBackup: val, backupFreq, selectedScopes });
                                if (val) {
                                    if (Platform.OS === 'web') {
                                        window.alert('Cloud Setup Required\n\nAutomatic cloud backup preference saved locally, but requires an active cloud backend configuration to perform real-time synchronization.');
                                    } else {
                                        Alert.alert(
                                            'Cloud Setup Required', 
                                            'Automatic cloud backup preference saved locally, but requires an active cloud backend configuration to perform real-time synchronization.',
                                            [{ text: 'OK' }]
                                        );
                                    }
                                }
                            }}
                        />
                    </View>
                </View>
                
                {!autoBackup && (
                    <View style={s.infoCard}>
                        <Info size={20} color={C.textMuted} style={{marginBottom: 8}} />
                        <Text style={s.infoTitle}>Local Architecture Active</Text>
                        <Text style={s.infoDesc}>Data remains securely on your device. Local backups can be manually created and exported as JSON files. Cloud automation features require a connected backend infrastructure.</Text>
                    </View>
                )}

                <View style={{ height: 40 }} />
                <SecurityFooter />

            </ScrollView>

            {/* SCOPE SELECTOR MODAL */}
            <Modal visible={scopeModal} transparent animationType="slide">
                <View style={s.modalOverlay}>
                    <View style={s.modalContent}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>Backup Scope</Text>
                            <TouchableOpacity onPress={() => setScopeModal(false)}>
                                <Text style={s.modalClose}>Done</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={s.modalDesc}>Select which modules to include in your local backup. Sensitive security tokens and PINs are always excluded.</Text>
                        
                        <ScrollView style={s.modalList}>
                            {scopes.map(sItem => (
                                <View key={sItem.id} style={s.scopeRow}>
                                    <Text style={s.scopeLabel}>{sItem.label}</Text>
                                    <Switch 
                                        trackColor={{ false: '#333', true: C.gold }}
                                        thumbColor={C.white}
                                        value={selectedScopes.includes(sItem.id)}
                                        onValueChange={(val) => {
                                            let newS = [...selectedScopes];
                                            if (val) newS.push(sItem.id);
                                            else newS = newS.filter(x => x !== sItem.id);
                                            setSelectedScopes(newS);
                                            savePreferences({ autoBackup, backupFreq, selectedScopes: newS });
                                        }}
                                    />
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* HISTORY MODAL */}
            <Modal visible={historyModal} transparent animationType="slide">
                <View style={s.modalOverlay}>
                    <View style={s.modalContentLarge}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>Backup History</Text>
                            <TouchableOpacity onPress={() => setHistoryModal(false)}>
                                <Text style={s.modalClose}>Close</Text>
                            </TouchableOpacity>
                        </View>

                        {history.length === 0 ? (
                            <View style={s.emptyState}>
                                <HardDrive size={48} color={C.textMuted} />
                                <Text style={s.emptyTitle}>No backups yet</Text>
                                <Text style={s.emptyDesc}>Create your first backup to keep your app data available when you need it.</Text>
                            </View>
                        ) : (
                            <ScrollView style={s.historyList}>
                                {history.map(item => (
                                    <View key={item.id} style={s.historyCard}>
                                        <View style={s.hCardTop}>
                                            <View>
                                                <Text style={s.hCardDate}>{formatDate(item.timestamp)}</Text>
                                                <Text style={s.hCardSize}>{formatBytes(item.sizeBytes)} • {item.scopes.length} Modules</Text>
                                            </View>
                                            <TouchableOpacity onPress={() => handleDeleteBackup(item.id)} style={{padding:4}}>
                                                <Trash2 color="#F44336" size={18} />
                                            </TouchableOpacity>
                                        </View>
                                        
                                        <View style={s.hCardActions}>
                                            <TouchableOpacity style={s.hActionBtn} onPress={() => handleRestore(item.id)}>
                                                <DownloadCloud color={C.white} size={16} />
                                                <Text style={s.hActionText}>Restore</Text>
                                            </TouchableOpacity>
                                            
                                            <TouchableOpacity style={s.hActionBtnSec} onPress={() => handleExportBackup(item.id)}>
                                                <FileJson color={C.textMuted} size={16} />
                                                <Text style={s.hActionTextSec}>Export JSON</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: 'transparent' },
    header: { 
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: 'rgba(240, 165, 0, 0.18)', backgroundColor: 'rgba(10, 10, 10, 0.92)'
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: C.white, letterSpacing: 0.3 },
    backBtn: { padding: 4 },
    
    scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
    
    statusCard: { 
        backgroundColor: 'rgba(22, 19, 13, 0.92)', padding: 20, borderRadius: 18, 
        borderWidth: 1.5, borderColor: 'rgba(240, 165, 0, 0.45)', marginBottom: 20,
        shadowColor: C.gold, shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15, shadowRadius: 8, elevation: 3
    },
    statusRow: { flexDirection: 'row', alignItems: 'center' },
    statusIconWrap: { width: 44, height: 44, borderRadius: 13, backgroundColor: 'rgba(240, 165, 0, 0.15)', borderWidth: 1, borderColor: 'rgba(240, 165, 0, 0.35)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    statusTextWrap: { flex: 1 },
    statusLabel: { fontSize: 11, color: '#8E8E93', fontWeight: '800', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 2 },
    statusValue: { fontSize: 16, fontWeight: '700' },
    statusDivider: { height: 1, backgroundColor: 'rgba(240, 165, 0, 0.2)', marginVertical: 16 },
    statusDetailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    statusDetailLabel: { fontSize: 13, color: '#8E8E93' },
    statusDetailValue: { fontSize: 13, color: C.white, fontWeight: '600' },

    actionRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    actionBtn: { flex: 1, height: 50, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    actionBtnText: { fontSize: 15, fontWeight: '800', marginLeft: 8 },
    actionBtnSec: { flex: 1, height: 50, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    actionBtnTextSec: { color: C.white, fontSize: 15, fontWeight: '700', marginLeft: 8 },

    sectionTitle: { fontSize: 11, color: '#8E8E93', fontWeight: '800', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 10, marginTop: 12 },
    settingGroup: { 
        backgroundColor: 'rgba(255, 255, 255, 0.035)', borderRadius: 16, 
        borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', 
        overflow: 'hidden', marginBottom: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15, shadowRadius: 6, elevation: 2 
    },
    settingRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.06)' },
    settingIconBg: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(240, 165, 0, 0.12)', borderWidth: 1, borderColor: 'rgba(240, 165, 0, 0.3)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    settingTextWrap: { flex: 1 },
    settingLabel: { fontSize: 15, color: C.white, fontWeight: '700', marginBottom: 2, letterSpacing: 0.2 },
    settingDesc: { fontSize: 12, color: '#8E8E93' },

    infoCard: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center' },
    infoTitle: { color: C.white, fontSize: 15, fontWeight: '700', marginBottom: 8 },
    infoDesc: { color: '#8E8E93', fontSize: 13, textAlign: 'center', lineHeight: 20 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: C.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, height: '60%' },
    modalContentLarge: { backgroundColor: C.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, height: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    modalTitle: { fontSize: 18, color: C.white, fontWeight: '700' },
    modalClose: { fontSize: 15, color: C.gold, fontWeight: '600' },
    modalDesc: { fontSize: 13, color: C.textMuted, marginBottom: 20, lineHeight: 20 },
    
    modalList: { flex: 1 },
    scopeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
    scopeLabel: { fontSize: 15, color: C.white, fontWeight: '500' },

    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    emptyTitle: { fontSize: 18, color: C.white, fontWeight: '600', marginTop: 16, marginBottom: 8 },
    emptyDesc: { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 22 },

    historyList: { flex: 1 },
    historyCard: { backgroundColor: C.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
    hCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    hCardDate: { fontSize: 15, color: C.white, fontWeight: '600', marginBottom: 4 },
    hCardSize: { fontSize: 12, color: C.textMuted },
    hCardActions: { flexDirection: 'row', gap: 12 },
    hActionBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 10, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    hActionText: { color: C.white, fontSize: 14, fontWeight: '600', marginLeft: 6 },
    hActionBtnSec: { flex: 1, borderWidth: 1, borderColor: C.border, paddingVertical: 10, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    hActionTextSec: { color: C.textMuted, fontSize: 14, fontWeight: '500', marginLeft: 6 }
});
