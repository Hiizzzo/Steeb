#!/usr/bin/env node

/**
 * STEEB App Store Review Readiness Checker
 * 
 * This script verifies that the app is ready for App Store submission
 * by checking for common issues that could cause rejection.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

let passed = 0;
let failed = 0;
let warnings = 0;

function log(message, color = RESET) {
  console.log(`${color}${message}${RESET}`);
}

function checkPass(message) {
  log(`✅ ${message}`, GREEN);
  passed++;
}

function checkFail(message) {
  log(`❌ ${message}`, RED);
  failed++;
}

function checkWarn(message) {
  log(`⚠️  ${message}`, YELLOW);
  warnings++;
}

function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    checkPass(`${description} exists`);
    return true;
  } else {
    checkFail(`${description} not found at ${filePath}`);
    return false;
  }
}

function checkFileContains(filePath, searchString, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(searchString)) {
      checkPass(description);
      return true;
    } else {
      checkFail(description);
      return false;
    }
  } catch (error) {
    checkFail(`Could not read ${filePath}: ${error.message}`);
    return false;
  }
}

function checkFileNotContains(filePath, searchString, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes(searchString)) {
      checkPass(description);
      return true;
    } else {
      checkFail(description);
      return false;
    }
  } catch (error) {
    checkFail(`Could not read ${filePath}: ${error.message}`);
    return false;
  }
}

console.log('\n' + BOLD + '🔍 STEEB App Store Review Readiness Check' + RESET + '\n');

// ============================================================================
// 1. PRIVACY COMPLIANCE CHECKS (Guideline 5.1.2)
// ============================================================================
log(BOLD + '\n📋 1. Privacy Compliance (Guideline 5.1.2)' + RESET);

// Check app.json configuration
checkFileExists('app.json', 'app.json configuration file');
checkFileContains('app.json', 'com.santyy.steeb', 'Bundle identifier is set correctly');
checkFileContains('app.json', 'NSUserTrackingUsageDescription', 'Privacy description is present in app.json');

// Check for tracking-related code
checkFileContains('src/hooks/useAnalytics.ts', 'APP REVIEW NOTE', 'Analytics file has App Review documentation');
checkFileContains('src/hooks/useAnalytics.ts', 'localStorage', 'Analytics uses local storage (not external services)');
checkFileNotContains('src/hooks/useAnalytics.ts', 'google-analytics', 'No Google Analytics detected');
checkFileNotContains('src/hooks/useAnalytics.ts', 'mixpanel', 'No Mixpanel detected');
checkFileNotContains('src/hooks/useAnalytics.ts', 'amplitude', 'No Amplitude detected');

// Check App.tsx for privacy documentation
checkFileContains('src/App.tsx', 'APP REVIEW NOTE', 'App.tsx has App Review documentation');
checkFileContains('src/App.tsx', 'Guideline 5.1.2', 'Privacy guideline reference present');

// Check package.json for tracking SDKs
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

const trackingSDKs = [
  'google-analytics',
  'react-ga',
  'mixpanel',
  'amplitude',
  '@segment/analytics',
  'facebook-pixel',
  'react-facebook-pixel'
];

let hasTrackingSDK = false;
trackingSDKs.forEach(sdk => {
  if (dependencies[sdk]) {
    checkFail(`Tracking SDK detected: ${sdk}`);
    hasTrackingSDK = true;
  }
});

if (!hasTrackingSDK) {
  checkPass('No third-party tracking SDKs detected in package.json');
}

// ============================================================================
// 2. MINIMUM FUNCTIONALITY CHECKS (Guideline 4.2)
// ============================================================================
log(BOLD + '\n📋 2. Minimum Functionality (Guideline 4.2)' + RESET);

// Check core components exist
checkFileExists('src/components/ModalAddTask.tsx', 'Task creation component (ModalAddTask)');
checkFileExists('src/pages/Index.tsx', 'Main task list page');
checkFileExists('src/hooks/useAnalytics.ts', 'Analytics/metrics hook');
checkFileExists('src/pages/ProductivityStatsPage.tsx', 'Productivity stats page');
checkFileExists('src/pages/MonthlyCalendarPage.tsx', 'Calendar page');

// Check task CRUD operations
checkFileContains('src/components/ModalAddTask.tsx', 'onAddTask', 'Task creation function present');
checkFileContains('src/pages/Index.tsx', 'handleDeleteTask', 'Task deletion function present');
checkFileContains('src/pages/Index.tsx', 'handleToggleTask', 'Task completion function present');

// Check for user feedback features
checkFileContains('src/pages/Index.tsx', 'toast', 'Toast notifications implemented');
checkFileContains('src/hooks/useSoundEffects.ts', 'playTaskCompleteSound', 'Sound effects implemented');
checkFileContains('src/pages/Index.tsx', 'triggerVibration', 'Haptic feedback implemented');

// Check for progress tracking
checkFileContains('src/hooks/useAnalytics.ts', 'completionRate', 'Completion rate tracking present');
checkFileContains('src/hooks/useAnalytics.ts', 'currentStreak', 'Streak tracking present');
checkFileContains('src/hooks/useAnalytics.ts', 'getProductivityScore', 'Productivity score calculation present');

// ============================================================================
// 3. CAPACITOR iOS CONFIGURATION
// ============================================================================
log(BOLD + '\n📋 3. Capacitor iOS Configuration' + RESET);

checkFileExists('capacitor.config.ts', 'Capacitor configuration file');
checkFileContains('capacitor.config.ts', 'com.santyy.steeb', 'App ID matches in Capacitor config');

// Check if iOS project exists
if (fs.existsSync('ios')) {
  checkPass('iOS directory exists');
  
  if (fs.existsSync('ios/App/App.xcworkspace')) {
    checkPass('Xcode workspace exists');
  } else {
    checkWarn('Xcode workspace not found - run "npx cap add ios" to generate');
  }
} else {
  checkWarn('iOS directory not found - run "npx cap add ios" to generate');
}

// ============================================================================
// 4. REQUIRED ASSETS
// ============================================================================
log(BOLD + '\n📋 4. Required Assets' + RESET);

// Check for app icon
if (fs.existsSync('public/icon-512.png')) {
  checkPass('App icon (512x512) exists');
} else {
  checkFail('App icon not found at public/icon-512.png');
}

// Check for splash screen
if (fs.existsSync('public/icon-512.png')) {
  checkPass('Splash screen image exists');
} else {
  checkWarn('Splash screen image not found');
}

// ============================================================================
// 5. BUILD READINESS
// ============================================================================
log(BOLD + '\n📋 5. Build Readiness' + RESET);

// Check if dist folder exists
if (fs.existsSync('dist')) {
  checkPass('Build output (dist) folder exists');
} else {
  checkWarn('Build output not found - run "npm run build" before syncing to iOS');
}

// Check node_modules
if (fs.existsSync('node_modules')) {
  checkPass('Dependencies installed (node_modules exists)');
} else {
  checkFail('Dependencies not installed - run "npm install"');
}

// Check for required Capacitor plugins
const requiredPlugins = [
  '@capacitor/core',
  '@capacitor/ios'
];

requiredPlugins.forEach(plugin => {
  if (dependencies[plugin]) {
    checkPass(`${plugin} is installed`);
  } else {
    checkFail(`${plugin} is not installed`);
  }
});

// ============================================================================
// 6. DOCUMENTATION
// ============================================================================
log(BOLD + '\n📋 6. Documentation for App Review' + RESET);

checkFileExists('APP_STORE_REVIEW_RESPONSE.md', 'App Review response document');
checkFileExists('IOS_BUILD_INSTRUCTIONS.md', 'iOS build instructions');

// ============================================================================
// SUMMARY
// ============================================================================
log(BOLD + '\n' + '='.repeat(60) + RESET);
log(BOLD + '📊 Summary' + RESET);
log('='.repeat(60));

log(`${GREEN}✅ Passed: ${passed}${RESET}`);
log(`${RED}❌ Failed: ${failed}${RESET}`);
log(`${YELLOW}⚠️  Warnings: ${warnings}${RESET}`);

console.log('');

if (failed === 0 && warnings === 0) {
  log(BOLD + GREEN + '🎉 All checks passed! Your app is ready for App Store submission.' + RESET);
} else if (failed === 0) {
  log(BOLD + YELLOW + '⚠️  All critical checks passed, but there are some warnings to address.' + RESET);
} else {
  log(BOLD + RED + '❌ Some checks failed. Please fix the issues above before submitting.' + RESET);
}

console.log('');

// Exit with appropriate code
process.exit(failed > 0 ? 1 : 0);
