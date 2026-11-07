@echo off
title TushuDiary - Copy Latest APK
echo ========================================================
echo   Copying latest built APK to main folder as TushuDiary.apk...
echo ========================================================
echo.

if exist "%~dp0mobile\android\app\build\outputs\apk\release\app-release.apk" (
    copy /Y "%~dp0mobile\android\app\build\outputs\apk\release\app-release.apk" "%~dp0TushuDiary.apk"
    echo [SUCCESS] Latest Release APK copied to: %~dp0TushuDiary.apk
) else if exist "%~dp0mobile\android\app\build\outputs\apk\debug\app-debug.apk" (
    copy /Y "%~dp0mobile\android\app\build\outputs\apk\debug\app-debug.apk" "%~dp0TushuDiary.apk"
    echo [SUCCESS] Latest Debug APK copied to: %~dp0TushuDiary.apk
) else (
    echo [INFO] APK not found yet.
    echo Please build APK in Android Studio first (Build -> Build APKs)
    echo Or double-click 'build-apk.bat' to build automatically.
)
echo.
pause
