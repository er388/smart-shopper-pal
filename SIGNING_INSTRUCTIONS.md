# Signed APK Build Instructions — Pson.io

## Prerequisites

Before you begin, make sure you have:
- **Node.js** (v18+) installed
- **Android Studio** installed with Android SDK
- **Java JDK** (v11 or v17) — needed for `keytool`
- The project cloned from GitHub

---

## Step 1 — Build the web app

```bash
npm install
npm run build
```

This creates the `dist/` folder with the production web assets.

### Troubleshooting
- If `npm install` fails, delete `node_modules` and `package-lock.json`, then retry.
- If `npm run build` has TypeScript errors, run `npx tsc --noEmit` to see all errors.

---

## Step 2 — Sync with Capacitor

```bash
npx cap sync android
```

This copies `dist/` into the Android project and updates native plugins.

### ⚠️ Important: Remove the server block for offline APK

Before building a production APK, edit `capacitor.config.ts` and **remove or comment out** the `server` block:

```ts
// Remove this for production:
// server: {
//   url: 'https://...',
//   cleartext: true
// }
```

Then run `npx cap sync android` again.

### Troubleshooting
- If `npx cap sync` fails with "android platform not found", run: `npx cap add android`
- If Gradle sync fails in Android Studio, go to File → Sync Project with Gradle Files

---

## Step 3 — Generate a keystore (one time only)

Run this in your terminal:

```bash
keytool -genkey -v -keystore pson-release-key.keystore \
  -alias pson-key -keyalg RSA -keysize 2048 -validity 10000
```

You'll be prompted for:
- **Keystore password** — choose a strong password, write it down
- **Your name, organization, etc.** — fill in or press Enter to skip
- **Key password** — can be the same as keystore password

Move the `.keystore` file to the `android/app/` directory:

```bash
mv pson-release-key.keystore android/app/
```

### ⚠️ NEVER commit the keystore to git!

Add to your `.gitignore`:
```
*.keystore
*.jks
```

---

## Step 4 — Configure Gradle signing

Create or edit `android/gradle.properties` and add:

```properties
MYAPP_UPLOAD_STORE_FILE=pson-release-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=pson-key
MYAPP_UPLOAD_STORE_PASSWORD=YOUR_STORE_PASSWORD
MYAPP_UPLOAD_KEY_PASSWORD=YOUR_KEY_PASSWORD
```

Replace `YOUR_STORE_PASSWORD` and `YOUR_KEY_PASSWORD` with the passwords you chose.

---

## Step 5 — Configure build.gradle

Edit `android/app/build.gradle`. Inside the `android { }` block, add:

```groovy
android {
    // ... existing config ...

    signingConfigs {
        release {
            storeFile file(MYAPP_UPLOAD_STORE_FILE)
            storePassword MYAPP_UPLOAD_STORE_PASSWORD
            keyAlias MYAPP_UPLOAD_KEY_ALIAS
            keyPassword MYAPP_UPLOAD_KEY_PASSWORD
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

## Step 6 — Replace app icons

Before building, replace the default icons with your Pson.io icons.

Icon locations in the Android project:
```
android/app/src/main/res/
├── mipmap-hdpi/ic_launcher.png        (72×72)
├── mipmap-mdpi/ic_launcher.png        (48×48)
├── mipmap-xhdpi/ic_launcher.png       (96×96)
├── mipmap-xxhdpi/ic_launcher.png      (144×144)
├── mipmap-xxxhdpi/ic_launcher.png     (192×192)
```

Also update round icons (`ic_launcher_round.png`) at the same paths if present.

You can generate all sizes from a single 512×512 PNG using:
- [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html)
- Or Android Studio: Right-click `res` → New → Image Asset

---

## Step 7 — Verify app name

Check that `android/app/src/main/res/values/strings.xml` contains:

```xml
<string name="app_name">Pson.io</string>
<string name="title_activity_main">Pson.io</string>
<string name="package_name">io.pson.app</string>
<string name="custom_url_scheme">io.pson.app</string>
```

If it still says "Pson", update it manually.

---

## Step 8 — Build release APK

```bash
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

### Or build AAB for Play Store:
```bash
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

---

## Step 9 — Install on device

Transfer the APK to your phone and install it, or use ADB:

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

---

## Complete build workflow (copy-paste)

```bash
# 1. Build web assets
npm install
npm run build

# 2. Sync with Android
npx cap sync android

# 3. Build release APK
cd android
./gradlew assembleRelease

# 4. Find your APK
ls -la app/build/outputs/apk/release/
```

---

## Troubleshooting

### "JAVA_HOME is not set"
Set JAVA_HOME to your JDK installation:
```bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
# or on macOS:
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

### "SDK location not found"
Create `android/local.properties`:
```
sdk.dir=/path/to/your/Android/Sdk
```
On macOS: `sdk.dir=/Users/YOUR_USER/Library/Android/sdk`
On Linux: `sdk.dir=/home/YOUR_USER/Android/Sdk`
On Windows: `sdk.dir=C:\\Users\\YOUR_USER\\AppData\\Local\\Android\\Sdk`

### "Keystore was tampered with, or password was incorrect"
- Double-check the password in `gradle.properties`
- Make sure the keystore file exists at `android/app/pson-release-key.keystore`

### "Execution failed for task ':app:minifyReleaseWithR8'"
This is a ProGuard/R8 error. Check `android/app/proguard-rules.pro` and add keep rules if needed.

### APK installs but shows wrong name or icon
- Run `npx cap sync android` again after updating icons/strings
- Clean the build: `cd android && ./gradlew clean && ./gradlew assembleRelease`
- Uninstall the old version from the device first

### Camera/barcode scanner doesn't work
Make sure `AndroidManifest.xml` has the camera permission:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
```

---

## Important Notes

- `capacitor.config.ts` has `appId: 'io.pson.app'` and `appName: 'Pson.io'`
- The `server` block in `capacitor.config.ts` is for **development only** — remove it before building production APK
- Keep your `.keystore` file backed up securely — you need the **same keystore** for all future updates
- Add `.keystore`, `.jks` files to `.gitignore`
