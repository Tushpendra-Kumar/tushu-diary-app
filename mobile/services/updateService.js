import { Alert, Linking, Platform } from 'react-native';

export const CURRENT_VERSION = '0.0.1';
export const BUILD_NUMBER = 1;

const MANIFEST_URL = 'https://raw.githubusercontent.com/Tushpendra-Kumar/tushu-diary-app/main/app-manifest.json';
const RELEASES_API_URL = 'https://api.github.com/repos/Tushpendra-Kumar/tushu-diary-app/releases/latest';
const FALLBACK_DOWNLOAD_URL = 'https://github.com/Tushpendra-Kumar/tushu-diary-app/releases/latest';

/**
 * Parses semver string into comparable parts
 * e.g., "0.0.2" -> [0, 0, 2]
 */
function parseVersion(v) {
  if (!v) return [0, 0, 0];
  const cleaned = String(v).replace(/^v/i, '').trim();
  const parts = cleaned.split('.').map(p => parseInt(p, 10) || 0);
  while (parts.length < 3) parts.push(0);
  return parts;
}

/**
 * Returns:
 *  1 if v1 > v2
 * -1 if v1 < v2
 *  0 if v1 === v2
 */
export function compareVersions(v1, v2) {
  const p1 = parseVersion(v1);
  const p2 = parseVersion(v2);
  for (let i = 0; i < 3; i++) {
    if (p1[i] > p2[i]) return 1;
    if (p1[i] < p2[i]) return -1;
  }
  return 0;
}

/**
 * Fetches latest version information from GitHub raw manifest or GitHub API
 */
export async function fetchLatestVersionInfo() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  // 1. Try raw app-manifest.json with cache buster
  try {
    const res = await fetch(`${MANIFEST_URL}?t=${Date.now()}`, {
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (res.ok) {
      clearTimeout(timeoutId);
      const manifest = await res.json();
      if (manifest && manifest.version) {
        return {
          version: manifest.version,
          versionCode: manifest.versionCode || 1,
          releasedAt: manifest.releasedAt || 'Latest',
          notes: manifest.notes || 'Performance enhancements & feature updates.',
          downloadUrl: manifest.downloadUrl || manifest.releaseUrl || FALLBACK_DOWNLOAD_URL,
          source: 'manifest'
        };
      }
    }
  } catch (err) {
    // Continue to GitHub API fallback
  }

  // 2. Fallback to GitHub Releases API
  try {
    const res = await fetch(RELEASES_API_URL, {
      signal: controller.signal,
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const release = await res.json();
      const rawTag = release.tag_name || release.name || '';
      const versionMatch = rawTag.match(/v?(\d+\.\d+\.\d+)/i);
      const version = versionMatch ? versionMatch[1] : (release.tag_name || '0.0.1');
      
      // Look for .apk asset
      const apkAsset = Array.isArray(release.assets) 
        ? release.assets.find(a => (a.name || '').endsWith('.apk')) 
        : null;
      const downloadUrl = apkAsset?.browser_download_url || release.html_url || FALLBACK_DOWNLOAD_URL;

      return {
        version,
        versionCode: 1,
        releasedAt: release.published_at ? release.published_at.split('T')[0] : 'Latest',
        notes: release.body || 'New features and stability updates.',
        downloadUrl,
        source: 'github-api'
      };
    }
  } catch (err) {
    clearTimeout(timeoutId);
  }

  throw new Error('Unable to fetch update information from GitHub.');
}

/**
 * Checks for updates and displays user-friendly native modal alerts
 * @param {object} options - { showAlert: boolean, onResult: function }
 */
export async function checkForAppUpdates({ showAlert = true, onResult = null } = {}) {
  try {
    const latest = await fetchLatestVersionInfo();
    const hasUpdate = compareVersions(latest.version, CURRENT_VERSION) > 0;

    if (onResult) onResult({ success: true, hasUpdate, latest, currentVersion: CURRENT_VERSION });

    if (hasUpdate) {
      const title = '🚀 Update Available!';
      const msg = `A new version (v${latest.version}) of TushuDiary is available on GitHub Releases.\n\n` +
        `• Current Version: v${CURRENT_VERSION}\n` +
        `• Latest Version: v${latest.version}\n` +
        `• Released: ${latest.releasedAt}\n\n` +
        `What's New:\n${latest.notes}\n\n` +
        `Would you like to download and install the update?`;

      if (Platform.OS === 'web') {
        if (window.confirm(`${title}\n\n${msg}`)) {
          window.open(latest.downloadUrl, '_blank');
        }
      } else {
        Alert.alert(
          title,
          msg,
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Download Update',
              style: 'default',
              onPress: () => {
                Linking.openURL(latest.downloadUrl).catch(() => {
                  Linking.openURL(FALLBACK_DOWNLOAD_URL);
                });
              }
            }
          ],
          { cancelable: true }
        );
      }
    } else {
      if (showAlert) {
        const title = 'App Up to Date ✓';
        const msg = `You are using the latest version of TushuDiary (v${CURRENT_VERSION}).\n\nNo updates are needed right now.`;
        if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
        else Alert.alert(title, msg, [{ text: 'OK' }]);
      }
    }

    return { success: true, hasUpdate, latest };
  } catch (err) {
    console.warn('[updateService] Check for updates failed:', err.message);
    if (onResult) onResult({ success: false, error: err.message, currentVersion: CURRENT_VERSION });

    if (showAlert) {
      const title = 'Update Check Failed';
      const msg = 'Unable to connect to GitHub update server.\n\nPlease check your internet connection and try again.';
      if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
      else Alert.alert(title, msg, [{ text: 'OK' }]);
    }

    return { success: false, error: err.message };
  }
}
