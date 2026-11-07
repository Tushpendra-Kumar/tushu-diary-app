@echo off
title TushuDiary - Install on Phone via ADB
echo ========================================================
echo   TushuDiary - Install APK to Connected Phone (ADB)
echo ========================================================
echo.

set "ADB_PATH=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"

if not exist "%ADB_PATH%" (
    where adb >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        set "ADB_PATH=adb"
    ) else (
        echo [ERROR] ADB not found at %LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe
        echo Please ensure Android SDK platform-tools is installed or ADB is in PATH.
        pause
        exit /b 1
    )
)

echo Checking connected devices...
"%ADB_PATH%" devices
echo.

if not exist "%~dp0TushuDiary.apk" (
    echo [INFO] TushuDiary.apk not found in root. Trying to copy from build outputs...
    call "%~dp0copy-latest-apk.bat"
)

if not exist "%~dp0TushuDiary.apk" (
    echo [ERROR] TushuDiary.apk is not available to install.
    echo Please run build-apk.bat first.
    pause
    exit /b 1
)

echo Installing TushuDiary.apk to device...
"%ADB_PATH%" install -r -d "%~dp0TushuDiary.apk"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo [SUCCESS] TushuDiary successfully installed on your phone!
    echo ========================================================
) else (
    echo.
    echo [ERROR] Installation failed. Make sure USB Debugging is turned on in your phone.
)

pause
