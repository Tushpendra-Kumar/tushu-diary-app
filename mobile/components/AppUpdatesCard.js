import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CURRENT_VERSION, fetchLatestVersionInfo, compareVersions } from '../services/updateService';
import { C } from '../constants/theme';

export default function AppUpdatesCard({ style }) {
  const [status, setStatus] = useState('idle'); // idle | checking | up_to_date | update_available | error
  const [latestInfo, setLatestInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleCheckUpdates = async () => {
    if (status === 'checking') return;
    setStatus('checking');
    setErrorMessage('');

    try {
      const latest = await fetchLatestVersionInfo();
      setLatestInfo(latest);

      const hasNewVersion = compareVersions(latest.version, CURRENT_VERSION) > 0;
      if (hasNewVersion) {
        setStatus('update_available');
      } else {
        setStatus('up_to_date');
      }
    } catch (err) {
      console.warn('[AppUpdatesCard] Check failed:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Unable to connect to GitHub update server.');
    }
  };

  const handleDownloadUpdate = () => {
    const downloadUrl = latestInfo?.downloadUrl || 
      'https://github.com/Tushpendra-Kumar/tushu-diary-app/releases/latest/download/TushuDiary.apk';
    Linking.openURL(downloadUrl).catch(() => {
      Linking.openURL('https://github.com/Tushpendra-Kumar/tushu-diary-app/releases/latest');
    });
  };

  return (
    <View style={[styles.card, style]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <Feather name="arrow-up-circle" size={20} color="#F0A500" />
          </View>
          <View>
            <Text style={styles.title}>App Updates</Text>
            <Text style={styles.subtitle}>Live Auto-Update & GitHub Releases</Text>
          </View>
        </View>
        <View style={styles.versionPill}>
          <Text style={styles.versionPillText}>v{CURRENT_VERSION}</Text>
        </View>
      </View>

      {/* Check Button */}
      <TouchableOpacity
        style={[styles.checkBtn, status === 'checking' && styles.checkBtnDisabled]}
        onPress={handleCheckUpdates}
        disabled={status === 'checking'}
        activeOpacity={0.85}
      >
        {status === 'checking' ? (
          <View style={styles.btnRow}>
            <ActivityIndicator size="small" color="#F0A500" style={{ marginRight: 8 }} />
            <Text style={styles.checkBtnText}>Checking GitHub...</Text>
          </View>
        ) : (
          <View style={styles.btnRow}>
            <Feather name="refresh-cw" size={16} color="#000000" style={{ marginRight: 8 }} />
            <Text style={styles.checkBtnText}>Check for Updates</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Status Output Box */}
      <View style={styles.statusContainer}>
        {status === 'idle' && (
          <View style={styles.statusBoxNeutral}>
            <Feather name="info" size={14} color="#9CA3AF" style={{ marginRight: 6 }} />
            <Text style={styles.statusTextNeutral}>
              Current build: v{CURRENT_VERSION}. Tap above with internet ON to check.
            </Text>
          </View>
        )}

        {status === 'checking' && (
          <View style={styles.statusBoxInfo}>
            <ActivityIndicator size="small" color="#38BDF8" style={{ marginRight: 8 }} />
            <Text style={styles.statusTextInfo}>
              Connecting to GitHub releases & manifest...
            </Text>
          </View>
        )}

        {status === 'up_to_date' && (
          <View style={styles.statusBoxSuccess}>
            <Feather name="check-circle" size={16} color="#10B981" style={{ marginRight: 8 }} />
            <Text style={styles.statusTextSuccess}>
              You're on the latest build (v{CURRENT_VERSION})! All up to date.
            </Text>
          </View>
        )}

        {status === 'update_available' && latestInfo && (
          <View style={styles.updateAvailableBox}>
            <View style={styles.updateTopRow}>
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>✨ New Version: v{latestInfo.version}</Text>
              </View>
              <Text style={styles.dateText}>{latestInfo.releasedAt}</Text>
            </View>

            <View style={styles.notesBox}>
              <Text style={styles.notesTitle}>What's New:</Text>
              <Text style={styles.notesBody}>{latestInfo.notes}</Text>
            </View>

            <TouchableOpacity
              style={styles.downloadBtn}
              onPress={handleDownloadUpdate}
              activeOpacity={0.85}
            >
              <Feather name="download" size={16} color="#000000" style={{ marginRight: 8 }} />
              <Text style={styles.downloadBtnText}>Download & Install Update (APK)</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'error' && (
          <View style={styles.statusBoxError}>
            <Feather name="alert-triangle" size={15} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={styles.statusTextError}>
              {errorMessage || 'Could not reach GitHub update server. Check your connection.'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(17, 21, 30, 0.85)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 2,
    ...(Platform.OS === 'web' ? {
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    } : {}),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(240, 165, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(240, 165, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12.5,
    color: '#636366',
    marginTop: 2,
    fontWeight: '400',
  },
  versionPill: {
    backgroundColor: 'rgba(240, 165, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(240, 165, 0, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  versionPillText: {
    color: '#F0A500',
    fontSize: 12,
    fontWeight: '700',
  },
  checkBtn: {
    backgroundColor: '#F0A500',
    borderRadius: 14,
    paddingVertical: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnDisabled: {
    backgroundColor: 'rgba(240, 165, 0, 0.25)',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  statusContainer: {
    marginTop: 12,
  },
  statusBoxNeutral: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statusTextNeutral: {
    color: '#9CA3AF',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  statusBoxInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statusTextInfo: {
    color: '#38BDF8',
    fontSize: 12,
    flex: 1,
  },
  statusBoxSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statusTextSuccess: {
    color: '#10B981',
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1,
  },
  statusBoxError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.30)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statusTextError: {
    color: '#EF4444',
    fontSize: 12,
    flex: 1,
  },
  updateAvailableBox: {
    backgroundColor: 'rgba(240, 165, 0, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(240, 165, 0, 0.35)',
    borderRadius: 12,
    padding: 12,
  },
  updateTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  newBadge: {
    backgroundColor: '#F0A500',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  newBadgeText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
  },
  dateText: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  notesBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  notesTitle: {
    color: '#F0A500',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  notesBody: {
    color: '#D1D5DB',
    fontSize: 12,
    lineHeight: 16,
  },
  downloadBtn: {
    flexDirection: 'row',
    backgroundColor: '#F0A500',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
});
