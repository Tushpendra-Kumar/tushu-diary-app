/**
 * TushuDiary Version Bump & Sync Automation Tool
 * 
 * Synchronizes versions across:
 * - app-manifest.json
 * - mobile/app.json
 * - mobile/android/app/build.gradle
 * - mobile/services/updateService.js
 * 
 * Usage:
 *   node scripts/bump-version.js 0.0.2 "Release Notes: New features added"
 *   node scripts/bump-version.js (auto-increments patch version)
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT_DIR, 'app-manifest.json');
const APP_JSON_PATH = path.join(ROOT_DIR, 'mobile', 'app.json');
const BUILD_GRADLE_PATH = path.join(ROOT_DIR, 'mobile', 'android', 'app', 'build.gradle');
const UPDATE_SERVICE_PATH = path.join(ROOT_DIR, 'mobile', 'services', 'updateService.js');

// 1. Read existing manifest
if (!fs.existsSync(MANIFEST_PATH)) {
  console.error('❌ app-manifest.json not found at:', MANIFEST_PATH);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
const currentVersion = manifest.version || '0.0.1';
const currentCode = parseInt(manifest.versionCode, 10) || 1;

// 2. Parse arguments
const args = process.argv.slice(2);
let targetVersion = args[0];
let targetNotes = args[1];

if (!targetVersion) {
  // Auto-increment patch: "0.0.1" -> "0.0.2"
  const parts = currentVersion.split('.').map(n => parseInt(n, 10) || 0);
  parts[2] = (parts[2] || 0) + 1;
  targetVersion = parts.join('.');
}

const targetCode = currentCode + 1;
const today = new Date().toISOString().split('T')[0];

if (!targetNotes) {
  targetNotes = `Release v${targetVersion}: Performance optimizations, UI refinements, and feature enhancements.`;
}

console.log('==============================================');
console.log(`📦 Bumping TushuDiary: v${currentVersion} (code ${currentCode}) ➔ v${targetVersion} (code ${targetCode})`);
console.log(`📅 Date: ${today}`);
console.log(`📝 Notes: ${targetNotes}`);
console.log('==============================================');

// 3. Update app-manifest.json
manifest.version = targetVersion;
manifest.versionCode = targetCode;
manifest.buildNumber = targetCode;
manifest.releasedAt = today;
manifest.notes = targetNotes;
fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log('✓ Updated app-manifest.json');

// 4. Update mobile/app.json
if (fs.existsSync(APP_JSON_PATH)) {
  const appJson = JSON.parse(fs.readFileSync(APP_JSON_PATH, 'utf8'));
  if (appJson.expo) {
    appJson.expo.version = targetVersion;
    if (appJson.expo.android) {
      appJson.expo.android.versionCode = targetCode;
    }
  }
  fs.writeFileSync(APP_JSON_PATH, JSON.stringify(appJson, null, 2) + '\n', 'utf8');
  console.log('✓ Updated mobile/app.json');
}

// 5. Update mobile/android/app/build.gradle
if (fs.existsSync(BUILD_GRADLE_PATH)) {
  let gradleContent = fs.readFileSync(BUILD_GRADLE_PATH, 'utf8');
  gradleContent = gradleContent.replace(/versionCode\s+\d+/g, `versionCode ${targetCode}`);
  gradleContent = gradleContent.replace(/versionName\s+["'][^"']+["']/g, `versionName "${targetVersion}"`);
  fs.writeFileSync(BUILD_GRADLE_PATH, gradleContent, 'utf8');
  console.log('✓ Updated mobile/android/app/build.gradle');
}

// 6. Update mobile/services/updateService.js
if (fs.existsSync(UPDATE_SERVICE_PATH)) {
  let serviceContent = fs.readFileSync(UPDATE_SERVICE_PATH, 'utf8');
  serviceContent = serviceContent.replace(/export const CURRENT_VERSION = ['"][^'"]+[''];/g, `export const CURRENT_VERSION = '${targetVersion}';`);
  serviceContent = serviceContent.replace(/export const BUILD_NUMBER = \d+;/g, `export const BUILD_NUMBER = ${targetCode};`);
  fs.writeFileSync(UPDATE_SERVICE_PATH, serviceContent, 'utf8');
  console.log('✓ Updated mobile/services/updateService.js');
}

console.log('==============================================');
console.log('🎉 Version synchronization complete!');
console.log('Next step: push changes to GitHub to trigger cloud APK build:');
console.log(`  git add .`);
console.log(`  git commit -m "chore(release): v${targetVersion}"`);
console.log(`  git push origin main`);
console.log('==============================================');
