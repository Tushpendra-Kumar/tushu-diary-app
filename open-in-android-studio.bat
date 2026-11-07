@echo off
title TushuDiary - Launching Android Studio
echo ========================================================
echo   TushuDiary - Launching Android Studio
echo ========================================================
echo.
echo Opening project in Android Studio...
if exist "C:\Program Files\Android\Android Studio\bin\studio64.exe" (
    start "" "C:\Program Files\Android\Android Studio\bin\studio64.exe" "%~dp0mobile\android"
) else if exist "%LOCALAPPDATA%\Programs\Android Studio\bin\studio64.exe" (
    start "" "%LOCALAPPDATA%\Programs\Android Studio\bin\studio64.exe" "%~dp0mobile\android"
) else (
    echo [ERROR] Android Studio not found in default paths!
    echo Please install Android Studio or specify its custom path.
    pause
    exit /b 1
)
echo.
echo ========================================================
echo   Android Studio khul raha hai!
echo   Upar Menu me jaayein:
echo   Build -> Build Bundle(s) / APK(s) -> Build APK(s)
echo   APK banne ke baad 'copy-latest-apk.bat' chalayein.
echo ========================================================
pause
