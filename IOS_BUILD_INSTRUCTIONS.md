# iOS Build Instructions for STEEB

## Prerequisites

Before building for iOS, ensure you have:
- ✅ macOS computer (required for iOS builds)
- ✅ Xcode installed (latest version from App Store)
- ✅ Apple Developer account
- ✅ Node.js and npm installed
- ✅ Capacitor CLI installed

---

## Step 1: Install Dependencies

```bash
# Navigate to project directory
cd "c:\Users\Santiago\Desktop\billy1dos3\STEVE\STEBE APP\stebe"

# Install npm dependencies
npm install

# Install Capacitor iOS
npm install @capacitor/ios
```

---

## Step 2: Build Web Assets

```bash
# Build the web app
npm run build

# This creates the 'dist' folder with compiled assets
```

---

## Step 3: Generate iOS Project

```bash
# Add iOS platform (first time only)
npx cap add ios

# Or sync if already added
npx cap sync ios
```

This will:
- Create the `ios/` directory
- Generate Xcode project files
- Copy web assets to iOS project
- Configure Info.plist with settings from app.json

---

## Step 4: Open in Xcode

```bash
# Open the iOS project in Xcode
npx cap open ios
```

Or manually open:
```
ios/App/App.xcworkspace
```

⚠️ **Important**: Always open the `.xcworkspace` file, NOT the `.xcodeproj` file!

---

## Step 5: Configure Signing in Xcode

1. Select the **App** target in Xcode
2. Go to **Signing & Capabilities** tab
3. Select your **Team** (Apple Developer account)
4. Xcode will automatically create provisioning profiles
5. Ensure **Bundle Identifier** matches: `com.santyy.steeb`

---

## Step 6: Update Info.plist (If Needed)

The Info.plist should already be configured from `app.json`, but verify:

```xml
<key>NSUserTrackingUsageDescription</key>
<string>This app does not track you. All data is stored locally on your device.</string>

<!-- Remove these if present (not needed): -->
<!-- NSCameraUsageDescription -->
<!-- NSPhotoLibraryUsageDescription -->
<!-- NSLocationWhenInUseUsageDescription -->
```

Location: `ios/App/App/Info.plist`

---

## Step 7: Build for Testing

### Test on Simulator:
1. Select a simulator from the device dropdown (e.g., iPhone 15 Pro)
2. Click the **Play** button (▶️) or press `Cmd + R`
3. App will launch in simulator

### Test on Physical Device:
1. Connect your iPhone via USB
2. Select your device from the device dropdown
3. Click **Play** button
4. First time: Trust the developer certificate on your iPhone
   - Settings → General → VPN & Device Management → Trust

---

## Step 8: Archive for App Store

### Create Archive:
1. In Xcode, select **Any iOS Device (arm64)** as target
2. Go to **Product** → **Archive**
3. Wait for archive to complete (5-10 minutes)
4. Archive Organizer will open automatically

### Upload to App Store Connect:
1. In Archive Organizer, select your archive
2. Click **Distribute App**
3. Select **App Store Connect**
4. Click **Upload**
5. Select signing options (Automatic is recommended)
6. Click **Upload**

---

## Step 9: Submit for Review in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app
3. Create a new version (1.0.0)
4. Fill in required information:
   - **What's New**: "Initial release of STEEB Task Manager"
   - **Description**: [Use description from APP_STORE_REVIEW_RESPONSE.md]
   - **Keywords**: task, productivity, todo, organizer, planner
   - **Screenshots**: Required (see below)
   - **App Icon**: 1024x1024 PNG

5. **Privacy Information**:
   - ❌ Does your app use the Advertising Identifier (IDFA)? → **NO**
   - ❌ Does your app contain third-party analytics? → **NO**
   - Data Collection:
     - ✅ Name (for personalization only)
     - ✅ Email (for authentication only)
     - ❌ NOT linked to user identity
     - ❌ NOT used for tracking

6. **Review Information**:
   - Attach `APP_STORE_REVIEW_RESPONSE.md` as notes
   - Provide demo account if authentication is required
   - Add contact information

7. Click **Submit for Review**

---

## Step 10: Respond to Rejection (If Needed)

If rejected again, use the `APP_STORE_REVIEW_RESPONSE.md` document to respond in App Store Connect Resolution Center.

### Key Points to Emphasize:
1. **No Tracking**: All data is local, no third-party services
2. **Full Functionality**: 8+ core features implemented
3. **Code References**: Point to specific files with "APP REVIEW NOTE" comments

---

## Common Issues & Solutions

### Issue: "No provisioning profiles found"
**Solution**: 
- Ensure you're logged into Xcode with Apple Developer account
- Go to Xcode → Preferences → Accounts → Download Manual Profiles

### Issue: "Code signing failed"
**Solution**:
- Check Bundle Identifier matches App Store Connect
- Ensure certificates are valid in Apple Developer portal

### Issue: "Build failed - missing dependencies"
**Solution**:
```bash
# Clean and reinstall
rm -rf node_modules
npm install
npx cap sync ios
```

### Issue: "App crashes on launch"
**Solution**:
- Check Xcode console for errors
- Verify all Capacitor plugins are installed
- Run `npx cap doctor` to diagnose

---

## Useful Commands

```bash
# Sync changes after modifying web code
npm run build && npx cap sync ios

# Update Capacitor
npm install @capacitor/core @capacitor/ios
npx cap sync

# Check Capacitor status
npx cap doctor

# Clean iOS build
cd ios && xcodebuild clean && cd ..
```

---

## Screenshots Required for App Store

You need screenshots for:
- **6.7" Display** (iPhone 15 Pro Max): 1290 x 2796 pixels
- **6.5" Display** (iPhone 11 Pro Max): 1242 x 2688 pixels
- **5.5" Display** (iPhone 8 Plus): 1242 x 2208 pixels

Recommended screenshots:
1. Main task list with tasks
2. Add task modal
3. Completed tasks with confetti
4. Productivity stats page
5. Calendar view

Use Xcode Simulator to capture:
- Run app in simulator
- `Cmd + S` to save screenshot
- Screenshots save to Desktop

---

## Final Checklist Before Submission

- ✅ App builds without errors
- ✅ Tested on physical device
- ✅ All features working (create, complete, delete tasks)
- ✅ Privacy declarations correct in App Store Connect
- ✅ Screenshots uploaded (all required sizes)
- ✅ App icon uploaded (1024x1024)
- ✅ Review notes attached (APP_STORE_REVIEW_RESPONSE.md)
- ✅ Contact information provided
- ✅ Version number matches (1.0.0)

---

## Support

If you encounter issues during the build process:

1. Check Capacitor docs: https://capacitorjs.com/docs/ios
2. Check Apple Developer forums
3. Run `npx cap doctor` for diagnostics
4. Check Xcode console for detailed errors

Good luck with your submission! 🚀
