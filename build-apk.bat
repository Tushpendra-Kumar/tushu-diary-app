@echo off
title TushuDiary - 1-Click Fast APK Generator
echo ========================================================
echo   TushuDiary - Standalone Android APK Generator
echo ========================================================
echo.

:: Detect Java from Android Studio JBR
if exist "C:\Program Files\Android\Android Studio\jbr\bin\java.exe" (
    set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
) else if exist "%LOCALAPPDATA%\Programs\Android Studio\jbr\bin\java.exe" (
    set "JAVA_HOME=%LOCALAPPDATA%\Programs\Android Studio\jbr"
) else (
    echo [WARNING] Android Studio JBR not found in standard paths. Using system Java.
)

set "PATH=%JAVA_HOME%\bin;%PATH%"
set "EXPO_NO_TELEMETRY=1"

echo Using Java:
java -version
echo.
echo Building Release APK with Gradle...
echo This will take 1-3 minutes on the first build...
echo.

cd /d "%~dp0mobile\android"
call gradlew.bat assembleRelease

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================================
    echo [BUILD FAILED] An error occurred during Gradle build.
    echo Opening in Android Studio is recommended to inspect errors.
    echo ========================================================
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ========================================================
echo [BUILD SUCCESS] APK built successfully!
echo Copying APK to root folder...
echo ========================================================

cd /d "%~dp0"
call copy-latest-apk.bat
