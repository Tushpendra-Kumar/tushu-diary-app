@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo     TUSHUDIARY AUTOMATED RELEASE PUBLISHER
echo ===================================================
echo.

if "%~1"=="" (
    node scripts/bump-version.js
) else (
    node scripts/bump-version.js "%~1" "%~2"
)

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Version bump failed.
    exit /b 1
)

echo.
echo [1/3] Staging version changes...
git add .

echo.
echo [2/3] Creating release commit...
git commit -m "chore(release): bump version via publisher script"

echo.
echo [3/3] Pushing to GitHub main branch...
git push origin main

echo.
echo ===================================================
echo [SUCCESS] Pushed to GitHub main!
echo GitHub Actions will now automatically build APK and
echo publish the release on GitHub Releases.
echo Track build: https://github.com/Tushpendra-Kumar/tushu-diary-app/actions
echo ===================================================
