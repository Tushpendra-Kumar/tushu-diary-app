# 📱 Android Studio & GitHub Automated Release Workflow

Welcome to the automated update pipeline for **TushuDiary**.

This guide explains how to open, build, edit, and automatically release updates for TushuDiary directly through **Android Studio** and **GitHub Actions**.

---

## 📂 1. Opening the Project in Android Studio

1. Launch **Android Studio**.
2. Click **Open** (or `File` ➔ `Open`).
3. Select the folder:  
   `E:\TushuDiary\mobile\android`  
   *(Always open the `mobile/android` directory, not the project root, so Gradle syncs properly!)*
4. Allow Android Studio to sync the Gradle project.

---

## 🛠️ 2. Making Code or UI Updates

- You can edit Java/Kotlin files in `mobile/android/app/src/main/java/`
- You can edit React Native components and screens in `mobile/screens/`, `mobile/components/`, etc.
- You can test live on an Android Emulator or physical device connected via USB.

---

## 🚀 3. Publishing an Update (1-Click Automated Sync)

Whenever you make updates and want to release a new version to GitHub and your app users:

### Option A: Via Terminal (Inside Android Studio or VSCode)
Run the automated update command:
```bash
scripts\publish-update.bat
```
*Or with custom version & release notes:*
```bash
scripts\publish-update.bat 0.0.2 "Release Notes: New Khata Book filters and improved Dark theme"
```

### Option B: Quick npm Command
```bash
npm run bump 0.0.2 "Release notes here"
git add .
git commit -m "chore(release): v0.0.2"
git push origin main
```

---

## ⚙️ 4. What Happens Automatically Behind the Scenes

```
┌─────────────────────────┐
│ Android Studio / Local  │ ➔ Update Code & Run scripts\publish-update.bat
└────────────┬────────────┘
             │ (git push origin main)
             ▼
┌─────────────────────────┐
│     GitHub Actions      │ ➔ Ubuntu Cloud Runner builds Release APK
└────────────┬────────────┘
             │ (softprops/action-gh-release@v2)
             ▼
┌─────────────────────────┐
│     GitHub Releases     │ ➔ New TushuDiary.apk published with Version Tag
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   TushuDiary App (User) │ ➔ In-App Checker detects update & prompts 1-tap install!
└─────────────────────────┘
```

1. **Version Auto-Sync**: The script updates `app-manifest.json`, `mobile/app.json`, `build.gradle`, and `updateService.js` in one go.
2. **Cloud Compilation**: GitHub Actions builds the optimized Release APK in the cloud.
3. **Release Publishing**: The new APK is tagged and published at `https://github.com/Tushpendra-Kumar/tushu-diary-app/releases`.
4. **Instant In-App Updates**: Any phone running TushuDiary will automatically detect the new version on app launch (or when tapping **Check for Updates** in Settings/Drawer) and prompt the user to download!
