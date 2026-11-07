import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Linking } from 'react-native';
import { 
  ShieldCheck, 
  Lock, 
  Database, 
  EyeOff, 
  FileText, 
  Smartphone, 
  Trash2, 
  Mail, 
  CheckCircle2, 
  Server,
  FolderCheck,
  KeyRound
} from 'lucide-react-native';
import { C } from '../../../constants/theme';
import ParticleBackground from '../../../components/ParticleBackground';

export default function PrivacyPolicyScreen({ navigation }) {
  const sections = [
    {
      id: 'core-principles',
      icon: ShieldCheck,
      title: '1. Our Privacy Principles',
      content: [
        'Local-First Privacy: Your personal expenses, khata entries, notes, and records are stored primarily on your device.',
        'Zero Data Monetization: We never sell, rent, monetize, or trade your personal information or financial records to data brokers, advertisers, or third parties.',
        'Strict User Isolation: Each account operates within an isolated sandbox. On shared devices, one user cannot inspect, restore, or modify another user\'s private ledger.'
      ]
    },
    {
      id: 'info-collected',
      icon: Database,
      title: '2. Information We Collect',
      content: [
        'Account Information: Name, email/username, optional phone number, and system role (User or Family Admin) to authenticate your access.',
        'Financial & Diary Records: Income/expense transactions, khata entries, categories, payment modes, personal diary notes, and daily tasks created by you.',
        'Attachments & Vault Data: Photos of receipts or avatars that you explicitly attach, and encrypted passwords stored within your Password Vault.',
        'Security Credentials: Password hashes (bcrypt on backend) and App Lock PIN hashes (salted SHA-256 in secure hardware storage). We never store or transmit your raw, plain-text security PINs or passwords.'
      ]
    },
    {
      id: 'data-storage',
      icon: Server,
      title: '3. Storage Architecture & Data Isolation',
      content: [
        'Local Device Storage: Stored locally in SQLite database (tushudiary.db) and user-keyed AsyncStorage / SecureStore (tushu_{userId}_*). Your data is segregated by user identifier.',
        'Cloud & Sync Storage: When cloud sync is utilized, records are protected over encrypted HTTPS/TLS connections to Firebase Firestore, protected by strict server-side authentication rules.',
        'Offline / Guest Mode: Guest accounts store data strictly in local storage and never transmit records to remote cloud servers.'
      ]
    },
    {
      id: 'device-permissions',
      icon: Smartphone,
      title: '4. Device Permissions & Usage',
      content: [
        'Camera & Media Library: Requested strictly when you choose to take or attach receipts, profile avatars, or diary photos. We never access your camera or photos in the background.',
        'Storage / File System: Used strictly when you trigger "Export to Excel/PDF" or "Backup / Restore" to save or select documents on your device.',
        'Biometrics (Face ID / Fingerprint): Managed natively through your device\'s secure hardware (Secure Enclave / Android BiometricPrompt). Your biometric traits never leave your device or enter app memory.'
      ]
    },
    {
      id: 'backups-exports',
      icon: FolderCheck,
      title: '5. Backups, Restores & Data Integrity',
      content: [
        'User-Scoped Backups: Local backup archives contain only records matching your authenticated user ID.',
        'Integrity & Anti-Tamper Verification: During database restoration, foreign account keys, unverified tokens, and extraneous data are strictly sanitized to prevent cross-account injection or corruption.',
        'Encrypted Password Vault: Stored credentials in your vault are secured with client-side AES encryption.'
      ]
    },
    {
      id: 'retention-deletion',
      icon: Trash2,
      title: '6. Data Retention & Deletion Rights',
      content: [
        'Record Deletion: You can modify or permanently delete individual transactions, khata records, and diary notes at any time.',
        'Recycle Bin: Soft-deleted items can be permanently purged or restored from the Recycle Bin.',
        'Account & Cloud Purge: You have the right to request complete account and cloud record deletion via Settings > Contact Admin.',
        'Local Data Wipe: Logging out clears session credentials; uninstalling the application or clearing device app data completely erases all local database records from your physical device.'
      ]
    },
    {
      id: 'contact',
      icon: Mail,
      title: '7. Privacy Contact & Audits',
      content: [
        'For privacy inquiries, audit questions, or data removal requests, reach out via Settings > Contact Admin or email privacy@codebytushu.com.'
      ]
    }
  ];

  return (
    <SafeAreaView style={s.safeArea}>
      <ParticleBackground />
      
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Header Badge */}
        <View style={s.badgeCard}>
          <View style={s.badgeHeader}>
            <ShieldCheck size={22} color={C.gold} />
            <Text style={s.badgeTitle}>TushuDiary Privacy Policy</Text>
          </View>
          <Text style={s.badgeSubtitle}>Brand: CodeByTushu  •  Version: 2.1 (October 2026)</Text>
          <Text style={s.badgeDescription}>
            We believe your financial and diary entries are strictly personal. This policy outlines our actual data architecture, isolation controls, and user privacy protections.
          </Text>
        </View>

        {/* Sections */}
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <View key={section.id} style={s.sectionCard}>
              <View style={s.sectionHeader}>
                <View style={s.iconWrapper}>
                  <Icon size={18} color={C.gold} />
                </View>
                <Text style={s.sectionTitle}>{section.title}</Text>
              </View>

              <View style={s.sectionBody}>
                {section.content.map((item, idx) => (
                  <View key={idx} style={s.bulletRow}>
                    <CheckCircle2 size={14} color={C.gold} style={s.bulletIcon} />
                    <Text style={s.bulletText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        <View style={s.footer}>
          <Text style={s.footerText}>TushuDiary  •  CodeByTushu  •  Your Life, Your Diary.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: C.bg || '#050505' 
  },
  content: { 
    padding: 16, 
    paddingBottom: 40 
  },
  badgeCard: {
    backgroundColor: 'rgba(240, 165, 0, 0.08)',
    borderColor: C.goldBorder || 'rgba(240, 165, 0, 0.35)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  badgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  badgeTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.gold || '#F0A500',
    letterSpacing: 0.3,
  },
  badgeSubtitle: {
    fontSize: 12,
    color: C.textMuted || '#8E8E93',
    marginBottom: 8,
    fontWeight: '500',
  },
  badgeDescription: {
    fontSize: 13,
    color: C.textSecondary || '#D0D0D0',
    lineHeight: 19,
  },
  sectionCard: {
    backgroundColor: C.card || 'rgba(255, 255, 255, 0.035)',
    borderColor: C.cardBorder || 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: C.goldDim || 'rgba(240, 165, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.goldBorder || 'rgba(240, 165, 0, 0.35)',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.white || '#FFFFFF',
    flex: 1,
  },
  sectionBody: {
    gap: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletIcon: {
    marginTop: 3,
    flexShrink: 0,
  },
  bulletText: {
    fontSize: 13,
    color: C.textSecondary || '#D0D0D0',
    lineHeight: 19,
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: C.textMuted || '#8E8E93',
    letterSpacing: 0.2,
  },
});
