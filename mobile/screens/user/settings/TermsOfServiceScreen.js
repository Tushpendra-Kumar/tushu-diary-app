import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { 
  FileText, 
  ShieldAlert, 
  UserCheck, 
  HardDriveDownload, 
  AlertTriangle, 
  Scale, 
  CheckCircle2,
  Ban
} from 'lucide-react-native';
import { C } from '../../../constants/theme';
import ParticleBackground from '../../../components/ParticleBackground';

export default function TermsOfServiceScreen({ navigation }) {
  const sections = [
    {
      id: 'acceptance',
      icon: Scale,
      title: '1. Acceptance of Terms',
      content: [
        'By downloading, accessing, or using TushuDiary ("the App"), provided by CodeByTushu ("we", "us", or "our"), you agree to be bound by these Terms of Service.',
        'If you do not agree to these terms, you must discontinue use and uninstall the App immediately.'
      ]
    },
    {
      id: 'accounts-security',
      icon: UserCheck,
      title: '2. User Accounts & Security Responsibility',
      content: [
        'Account Safeguarding: You are solely responsible for maintaining the confidentiality of your account credentials, App Lock PIN, and device passcode.',
        'Immediate Notification: You agree to notify administrators promptly if you suspect any unauthorized access to your account or device.',
        'Accurate Information: Any account information provided must be accurate, up to date, and lawfully owned by you.'
      ]
    },
    {
      id: 'data-ownership-backups',
      icon: HardDriveDownload,
      title: '3. Data Ownership & Backup Duty',
      content: [
        'User Ownership: You retain 100% intellectual property and ownership over all financial entries, diary logs, notes, and media uploaded by you.',
        'Local-First Offline Architecture: TushuDiary stores your entries primarily on your local physical device. You are responsible for routinely generating local backups via Settings > Backup & Restore.',
        'No Liability for Unbacked Local Loss: CodeByTushu is not liable for data loss arising from physical device damage, operating system reinstalls, device theft, or application uninstalls where recent backups were not maintained.'
      ]
    },
    {
      id: 'prohibited-conduct',
      icon: Ban,
      title: '4. Prohibited Conduct & Fair Use',
      content: [
        'No Reverse Engineering: You agree not to decompile, reverse engineer, extract source code, or attempt to tamper with app binaries or encryption keys.',
        'No Authorization Bypass: You must not attempt to exploit APIs, bypass role-based access controls, or gain unauthorized access to Admin modules or other users\' data.',
        'No Malicious Backup Injection: Injecting modified, malicious, or foreign user IDs into backup archives to corrupt data or compromise system integrity is strictly prohibited.'
      ]
    },
    {
      id: 'financial-disclaimer',
      icon: AlertTriangle,
      title: '5. Financial Disclaimer',
      content: [
        'Personal Bookkeeping Tool Only: TushuDiary is designed strictly as a personal finance management, khata tracker, and diary tool.',
        'Not Certified Advice: The App does not provide certified financial, legal, investment, or tax advice. You are responsible for verifying your mathematical ledger records against official bank statements.'
      ]
    },
    {
      id: 'termination',
      icon: ShieldAlert,
      title: '6. Account Termination & Enforcement',
      content: [
        'Termination for Cause: We reserve the right to suspend or terminate accounts, revoke API access, or block compromised devices that violate these Terms or threaten service security.',
        'Survival of Provisions: Sections regarding data ownership, disclaimers, and prohibited actions will survive any account termination.'
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
            <FileText size={22} color={C.gold} />
            <Text style={s.badgeTitle}>Terms of Service</Text>
          </View>
          <Text style={s.badgeSubtitle}>Brand: CodeByTushu  •  Effective: October 2026</Text>
          <Text style={s.badgeDescription}>
            Please read these terms carefully before using TushuDiary. They establish your rights, responsibilities, and data protections when using our service.
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
