import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, TextInput } from 'react-native';
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Lock, 
  FolderCheck, 
  Trash2, 
  LifeBuoy, 
  Search, 
  MessageSquare
} from 'lucide-react-native';
import { C } from '../../../constants/theme';
import ParticleBackground from '../../../components/ParticleBackground';

const FAQ_DATA = [
  {
    category: 'Account & Security',
    icon: Lock,
    items: [
      {
        id: 'sec-1',
        question: 'How is my account secured?',
        answer: 'TushuDiary protects your account using bcrypt password hashing on our authentication servers and JWT (JSON Web Tokens) for API communication. On your local device, App Lock PINs are secured with salted SHA-256 cryptographic hashing in secure device storage.'
      },
      {
        id: 'sec-2',
        question: 'How do I set up or change my App Lock PIN?',
        answer: 'Navigate to Settings > App Lock. Enter your desired 4-digit PIN and confirm it. You can also enable Biometric Unlock (Face ID or Fingerprint) to quickly authenticate without typing your PIN every time.'
      },
      {
        id: 'sec-3',
        question: 'How do I change my password?',
        answer: 'Go to Settings > Change Password (under Privacy & Security). You will be required to verify your current password before setting a new secure password.'
      },
      {
        id: 'sec-4',
        question: 'What happens when I log out?',
        answer: 'When you log out, your active authentication tokens and runtime cached credentials are systematically purged from device memory and AsyncStorage, preventing unauthorized session resumption.'
      }
    ]
  },
  {
    category: 'Privacy & Data Isolation',
    icon: ShieldCheck,
    items: [
      {
        id: 'priv-1',
        question: 'Can another user on my device see my records?',
        answer: 'No. TushuDiary enforces strict user data isolation. All local records, keys, and preferences are scoped to your unique account ID (e.g. tushu_{userId}_*). If another person logs in on the same phone, their workspace is completely segregated.'
      },
      {
        id: 'priv-2',
        question: 'Does TushuDiary sell or share my data?',
        answer: 'Never. We do not sell, rent, or share your financial, diary, or personal information with advertising brokers, third-party analytics trackers, or data aggregators.'
      },
      {
        id: 'priv-3',
        question: 'Is my Password Vault encrypted?',
        answer: 'Yes. Stored passwords and secret items inside your Password Vault are encrypted using client-side AES encryption algorithms before being committed to persistent storage.'
      }
    ]
  },
  {
    category: 'Backups & Restores',
    icon: FolderCheck,
    items: [
      {
        id: 'bak-1',
        question: 'How do I create a local backup of my ledger?',
        answer: 'Go to Settings > Backup & Restore > Create Backup. The app generates a structured backup JSON package of your transactions, khata entries, categories, and notes.'
      },
      {
        id: 'bak-2',
        question: 'How does backup restore safeguard against data mixing?',
        answer: 'During restoration, our restore engine verifies the user identity of every record. Foreign account keys, unauthorized tokens, and cross-user data entries are automatically filtered out to prevent data pollution.'
      },
      {
        id: 'bak-3',
        question: 'Where are my backup files saved?',
        answer: 'Backups are stored inside your device\'s secure app document directory. You can also use the Share/Export option to save a copy to your Google Drive, iCloud, or external storage.'
      }
    ]
  },
  {
    category: 'Data Export & Deletion',
    icon: Trash2,
    items: [
      {
        id: 'del-1',
        question: 'How do I export my financial reports?',
        answer: 'You can export your expenses and khata statements as Excel (.xlsx) spreadsheets or PDF reports via the Export buttons located in Khata and Reports sections.'
      },
      {
        id: 'del-2',
        question: 'How does the Recycle Bin work?',
        answer: 'When you delete a transaction or note, it is initially moved to the Recycle Bin. You can review items here to either restore them back to your ledger or permanently erase them.'
      },
      {
        id: 'del-3',
        question: 'How do I permanently delete my account & cloud data?',
        answer: 'You can request full account deletion and cloud record purging by navigating to Settings > Contact Admin or contacting our privacy team at privacy@codebytushu.com.'
      }
    ]
  },
  {
    category: 'Support & Help',
    icon: LifeBuoy,
    items: [
      {
        id: 'sup-1',
        question: 'How do I report a problem or request a feature?',
        answer: 'Use the "Contact Admin" screen under Settings to submit feedback directly to the administrator, or reach out to our team at support@codebytushu.com.'
      },
      {
        id: 'sup-2',
        question: 'What if I forget my App Lock PIN?',
        answer: 'If you have biometrics enabled, you can authenticate using your fingerprint or Face ID. Otherwise, you can log out and re-authenticate using your account password to reset the PIN.'
      }
    ]
  }
];

export default function HelpCenterScreen({ navigation }) {
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', ...FAQ_DATA.map(c => c.category)];

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  // Filter items based on category and search query
  const filteredCategories = FAQ_DATA.map(cat => {
    if (selectedCategory !== 'All' && cat.category !== selectedCategory) {
      return null;
    }
    const matchingItems = cat.items.filter(item => {
      const q = searchQuery.toLowerCase();
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q)
      );
    });
    if (matchingItems.length === 0) return null;
    return {
      ...cat,
      items: matchingItems
    };
  }).filter(Boolean);

  return (
    <SafeAreaView style={s.safeArea}>
      <ParticleBackground />
      
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Header Banner */}
        <View style={s.badgeCard}>
          <View style={s.badgeHeader}>
            <HelpCircle size={22} color={C.gold} />
            <Text style={s.badgeTitle}>TushuDiary Help Center</Text>
          </View>
          <Text style={s.badgeSubtitle}>Find answers to security, backups, privacy, and app features</Text>
        </View>

        {/* Search Bar */}
        <View style={s.searchBar}>
          <Search size={18} color={C.textMuted || '#8E8E93'} style={s.searchIcon} />
          <TextInput
            style={s.searchInput}
            placeholder="Search questions or keywords..."
            placeholderTextColor={C.textMuted || '#8E8E93'}
            underlineColorAndroid="transparent"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Category Pills */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={s.pillContainer}
        >
          {categories.map((cat, idx) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={idx}
                style={[s.pill, isSelected && s.pillActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <Text style={[s.pillText, isSelected && s.pillTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* FAQ Groups */}
        {filteredCategories.length === 0 ? (
          <View style={s.noResults}>
            <HelpCircle size={36} color={C.textMuted || '#8E8E93'} />
            <Text style={s.noResultsText}>No matching answers found</Text>
            <Text style={s.noResultsSub}>Try adjusting your search terms or category filter</Text>
          </View>
        ) : (
          filteredCategories.map((group) => {
            const GroupIcon = group.icon;
            return (
              <View key={group.category} style={s.groupContainer}>
                <View style={s.groupHeader}>
                  <GroupIcon size={16} color={C.gold} />
                  <Text style={s.groupTitle}>{group.category}</Text>
                </View>

                {group.items.map((item) => {
                  const isExpanded = expandedId === item.id;
                  return (
                    <View key={item.id} style={s.faqItem}>
                      <TouchableOpacity
                        style={s.faqHeader}
                        onPress={() => toggleExpand(item.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={s.question}>{item.question}</Text>
                        {isExpanded ? (
                          <ChevronUp size={18} color={C.gold} />
                        ) : (
                          <ChevronDown size={18} color={C.textMuted || '#8E8E93'} />
                        )}
                      </TouchableOpacity>
                      {isExpanded && (
                        <View style={s.faqBody}>
                          <Text style={s.answer}>{item.answer}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })
        )}

        {/* Contact Admin Quick Action */}
        <TouchableOpacity 
          style={s.contactCard}
          onPress={() => navigation.navigate('ContactAdmin')}
          activeOpacity={0.8}
        >
          <View style={s.contactIconWrapper}>
            <MessageSquare size={20} color={C.gold} />
          </View>
          <View style={s.contactTextWrapper}>
            <Text style={s.contactTitle}>Still need assistance?</Text>
            <Text style={s.contactSubtitle}>Reach out directly to the Administrator</Text>
          </View>
        </TouchableOpacity>

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
    marginBottom: 14,
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
    color: C.textSecondary || '#D0D0D0',
    lineHeight: 18,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.input || 'rgba(255, 255, 255, 0.035)',
    borderColor: C.inputBorder || 'rgba(255, 255, 255, 0.09)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: C.white || '#FFFFFF',
    fontSize: 14,
    outlineStyle: 'none',
  },
  pillContainer: {
    paddingBottom: 14,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  pillActive: {
    backgroundColor: C.goldDim || 'rgba(240, 165, 0, 0.15)',
    borderColor: C.goldBorder || 'rgba(240, 165, 0, 0.45)',
  },
  pillText: {
    fontSize: 12,
    color: C.textMuted || '#8E8E93',
    fontWeight: '500',
  },
  pillTextActive: {
    color: C.gold || '#F0A500',
    fontWeight: '700',
  },
  groupContainer: {
    marginBottom: 16,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.gold || '#F0A500',
    letterSpacing: 0.2,
  },
  faqItem: {
    marginBottom: 8,
    backgroundColor: C.card || 'rgba(255, 255, 255, 0.035)',
    borderColor: C.cardBorder || 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  question: {
    fontSize: 14,
    fontWeight: '600',
    color: C.white || '#FFFFFF',
    flex: 1,
    marginRight: 10,
    lineHeight: 20,
  },
  faqBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    paddingTop: 10,
  },
  answer: {
    fontSize: 13,
    color: C.textSecondary || '#D0D0D0',
    lineHeight: 20,
  },
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  noResultsText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.white || '#FFFFFF',
    marginTop: 8,
  },
  noResultsSub: {
    fontSize: 12,
    color: C.textMuted || '#8E8E93',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 165, 0, 0.06)',
    borderColor: C.goldBorder || 'rgba(240, 165, 0, 0.35)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 6,
    marginBottom: 10,
    gap: 12,
  },
  contactIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.goldDim || 'rgba(240, 165, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.goldBorder || 'rgba(240, 165, 0, 0.35)',
  },
  contactTextWrapper: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.white || '#FFFFFF',
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 12,
    color: C.textSecondary || '#D0D0D0',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  footerText: {
    fontSize: 12,
    color: C.textMuted || '#8E8E93',
    letterSpacing: 0.2,
  },
});
