# Android preview

Build the preview from PowerShell with JDK 17 and Android SDK Platform 36
and Build Tools 36.0.0 installed.

```powershell
./android/build-preview.ps1 -Sdk C:/Android/sdk -Output C:/Temp/hs-preview.apk -KeyStore C:/Private/hs-preview.jks
```

The app asks for the shared HTTPS workspace address and then opens the
regular sign-in screen. The APK contains no credentials or records.
File selection uses Android's picker. The local laptop address will
only work on the laptop. A real-device trial needs a shared HTTPS backend.
Preview signing is intended for development. Use a separate release key
and verify installation and updates before distribution.
