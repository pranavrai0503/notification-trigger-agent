# notification-trigger-agent
# Notification Trigger Agent - Comprehensive Requirements Document

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Functional Requirements](#functional-requirements)
4. [Panel UI Specifications](#panel-ui-specifications)
5. [Device Setup & Management](#device-setup--management)
6. [App State Management](#app-state-management)
7. [Notification Verification](#notification-verification)
8. [Notification Interaction & Landing Page Validation](#notification-interaction--landing-page-validation)
9. [Log Extraction & Viewing](#log-extraction--viewing)
10. [API Integration](#api-integration)
11. [Test Execution Flow](#test-execution-flow)
12. [Test Output & Reporting](#test-output--reporting)
13. [Configuration & Setup](#configuration--setup)
14. [Non-Functional Requirements](#non-functional-requirements)
15. [Glossary](#glossary)

---

## Executive Summary

The **Notification Trigger Agent** is an automated testing platform designed to validate push notifications and in-app notification delivery across iOS and Android applications. The system allows users to:

- Input test parameters (API endpoint, user credentials, event codes, app state preferences)
- Automatically provision real devices via BrowserStack
- Execute notification API calls
- Verify notification delivery on both platforms
- Validate notification interaction and landing page navigation
- Extract and view event logs from both platforms
- Generate comprehensive test reports with screenshots and logs

**Target Users:** QA Engineers, DevOps Engineers, Product Managers  
**Platforms:** Android and iOS (via BrowserStack)  
**Key Languages:** TypeScript/Node.js (Backend), React (Frontend), Appium (Test Automation)

---

## System Overview

### Architecture Components

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER INTERFACE (REACT)                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  • Test Input Panel (cURL, Credentials, Event Code)     │   │
│  │  • App State Selection                                  │   │
│  │  • Notification Verification Options                    │   │
│  │  • Test Execution Controls                              │   │
│  │  • Results & Log Viewer                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└─���───────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND API (NODE.JS/EXPRESS)                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  • cURL Parser                                          │   │
│  │  • Test Orchestrator                                    │   │
│  │  • BrowserStack Manager                                 │   │
│  │  • Log Aggregator & Extractor                           │   │
│  │  • Notification Verifier                                │   │
│  │  • Report Generator                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      BROWSERSTACK CLOUD                         │
│  ┌─────���────────────┐  ┌──────────────────┐                    │
│  │  Android Device  │  │   iOS Device     │                    │
│  │  (Real Device)   │  │  (Real Device)   │                    │
│  │  ┌────────────┐  │  │  ┌────────────┐  │                    │
│  │  │ App        │  │  │  │ App        │  │                    │
│  │  │ Installed  │  │  │  │ Installed  │  │                    │
│  │  └────────────┘  │  │  └────────────┘  │                    │
│  └──────────────────┘  └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   NOTIFICATION API SERVICE                      │
│         (Third-party service that sends notifications)          │
└─────────────────────────────────────────────────────────────────┘
```

### Key Services

| Service | Responsibility |
|---------|-----------------|
| **cURL Parser** | Extract API endpoint, headers, body, event code from curl commands |
| **BrowserStack Manager** | Device provisioning, app upload, session management |
| **Login Automator** | Automate app login using Appium |
| **App State Manager** | Switch app between foreground, background, and killed states |
| **Notification Verifier** | Detect and validate push notifications and in-app notifications |
| **Log Extractor** | Extract logs from Android (logcat) and iOS (syslog) |
| **Test Orchestrator** | Coordinate all services for complete test flow |
| **Report Generator** | Generate comprehensive test reports |

---

## Functional Requirements

### FR-1: Test Input & Configuration

**Requirement:** Users can input all necessary test parameters through a unified panel.

**Details:**
- Accept raw cURL commands with automatic parameter extraction
- Accept manual input for UserID, Username, Password
- Support selection of app state after login
- Support toggle for in-app notification centre verification
- Display parsed parameters for confirmation before execution

**Acceptance Criteria:**
- cURL parser correctly extracts event code, user ID, and API endpoint
- Username and password fields are properly masked
- Event code is auto-populated from cURL or manual input
- All fields are validated before test execution

### FR-2: Device Provisioning & App Installation

**Requirement:** Automatically provision real devices on BrowserStack with app installed.

**Details:**
- Upload APK and IPA files to BrowserStack
- Provision Android device (e.g., Google Pixel 8, Android 14.0)
- Provision iOS device (e.g., iPhone 15, iOS 17.0)
- Manage parallel device sessions
- Handle app installation and verification

**Acceptance Criteria:**
- Both devices provision within 60 seconds
- App is successfully installed on both devices
- Devices are accessible via Appium
- Session IDs are generated and logged

### FR-3: User Login Automation

**Requirement:** Automatically log in test users on both devices.

**Details:**
- Use provided username and password
- Navigate app UI to login screen
- Input credentials and submit login form
- Handle 2FA if required
- Verify successful login by detecting home screen

**Acceptance Criteria:**
- Login completes within 10 seconds
- Home screen is verified on both devices
- Login errors are captured and reported
- Screenshot is taken of successful login state

### FR-4: App State Management

**Requirement:** Switch app to desired state after login.

**States:**
1. **Foreground** - App remains open and active
2. **Background** - App sent to background (still running in memory)
3. **Killed** - App process is terminated

**Details:**
- User selects desired state from dropdown
- Backend executes state change via Appium
- State change is logged with timestamp
- For Background: App returns to foreground after 10 seconds (or on notification)
- For Killed: App can be relaunched for in-app verification if checkbox selected

**Acceptance Criteria:**
- State change completes successfully
- App state is verified (e.g., process status check)
- Timestamps are logged
- State change doesn't affect test execution

### FR-5: Notification Trigger (API Execution)

**Requirement:** Execute notification API call with provided parameters.

**Details:**
- Parse and validate cURL command
- Extract HTTP method, URL, headers, body
- Substitute/validate userId and eventCode in body
- Execute API call against target service
- Capture response code and response time
- Log complete request and response

**Acceptance Criteria:**
- API call executes with provided parameters
- Response code is captured (e.g., 200, 400, 500)
- Response time is measured
- Request/response is logged with timestamp
- Errors are handled gracefully

### FR-6: Push Notification Verification

**Requirement:** Detect and verify push notifications on devices.

**Details:**
- For **Killed/Background apps**: Check OS notification shade/centre
- For **Foreground apps**: Check system notification if visible
- Extract notification title and message
- Verify notification contains expected content
- Capture screenshot of notification
- Log notification detection timestamp

**Always Executed:** Push notification verification runs regardless of in-app notification centre checkbox.

**Acceptance Criteria:**
- Notification is detected within 5 seconds of API call
- Notification text matches expected content
- Screenshot shows notification clearly
- Timestamp is logged

### FR-7: In-App Notification Centre Verification

**Requirement:** Optionally verify notifications in the app's in-app notification centre.

**Details:**
- **Checkbox Control:** User can enable/disable this verification
- If **Enabled:**
  - App is brought to foreground
  - Navigate to notification centre (dashboard touchpoint)
  - Search for notification in centre list
  - Verify notification content and metadata
  - Capture screenshot
- If **Disabled:**
  - Only push notification verification runs
  - In-app centre is not checked

**Notification Centre Touchpoint (per platform):**
- **Android:** `~notificationCentreIcon` on dashboard
- **iOS:** `~notificationCentreIcon` on dashboard

**Acceptance Criteria:**
- If enabled, in-app notification is found and logged
- If disabled, verification is skipped
- Screenshots show notification centre view
- Log entry indicates where notification was found (push/centre)

### FR-8: Notification Interaction & Landing Page Validation

**Requirement:** Automate tap on notification and validate landing page.

**Details:**
- **Tap Notification:**
  - Click/tap on detected notification (push or in-app centre)
  - Handle any intermediate screens or confirmations
- **Wait for Navigation:**
  - Wait for app to navigate to expected landing page (timeout: 3 seconds)
  - Handle deep-link routing
- **Landing Page Validation:**
  - Verify page title matches expected value
  - Verify all required UI elements are present
  - Verify deep-link in URL if applicable
  - Capture screenshot of landing page
- **Log Result:**
  - Log success/failure status
  - Log actual landing page vs expected
  - Log validation details

**Expected Landing Pages (Configurable by Event Code):**

| Event Code | Expected Page | Required Elements | Deep Link |
|------------|---------------|-------------------|-----------|
| ORDER_SHIPPED | Order Details | orderTitle, orderStatus, trackingInfo | /orders/ |
| PAYMENT_RECEIVED | Payment Confirmation | confirmationMessage, receiptDetails, transactionId | /payments/ |
| PROMOTION_AVAILABLE | Offers & Promotions | promoTitle, promoDescription, applyButton | /promotions/ |

**Acceptance Criteria:**
- Notification tap triggers navigation
- Expected landing page is reached
- All required UI elements are verified
- Deep-link matches expected pattern
- Screenshot confirms correct landing page

### FR-9: Android Log Extraction

**Requirement:** Extract event logs from Android devices using logcat filter.

**Filter Pattern:** `naukriApp.appModules.login logsUBA`

**Extracted Events:**
- `communicationStatus` - Status of communication/notification
- `communicationOpen` - Notification was opened/viewed
- `communicationClick` - Notification was clicked
- `appLaunch` - App launch event
- `referrer: notification` - Any event triggered by a notification

**Log Format:** JSON embedded in logcat output
```
naukriApp.appModules.login logsUBA: {"eventName":"communicationClick","userId":"12345","referrer":"notification",...}
```

**Details:**
- Pull logcat using `adb logcat -d | grep "naukriApp.appModules.login logsUBA"`
- Parse JSON payloads from log lines
- Filter by event name and/or referrer
- Store logs with timestamps
- Make logs available for UI display

**Acceptance Criteria:**
- Logs are extracted after test execution
- JSON payloads are correctly parsed
- Event names are correctly identified
- Referrer field is extracted
- Logs can be filtered by event name

### FR-10: iOS Log Extraction

**Requirement:** Extract UBA logs from iOS devices.

**Filter Pattern:** `UBA Logs : request-->{json data}`

**Extracted Events:** Same as Android (communicationStatus, communicationOpen, communicationClick, appLaunch, referrer: notification)

**Log Format:** Syslog entries containing JSON payloads
```
UBA Logs : request--> {"eventName":"communicationOpen","userId":"12345","referrer":"notification",...}
```

**Details:**
- Pull device logs via Appium `getLog('syslog')`
- Search for lines containing `"UBA Logs : request-->"`
- Extract JSON payloads from matching lines
- Parse and validate JSON
- Filter by event name and/or referrer
- Store logs with timestamps

**Acceptance Criteria:**
- UBA logs are extracted from device
- JSON payloads are correctly parsed
- Event names are correctly identified
- Logs can be filtered by event name and referrer
- Both platforms return similar data structures

### FR-11: Log Viewer & Filter Panel

**Requirement:** Display extracted logs with event-based filtering and viewing.

**UI Components:**
- **Dropdown:** Select event to view
  - communicationStatus
  - communicationOpen
  - communicationClick
  - appLaunch
  - referrer: notification (shows all logs with referrer="notification")
- **Platform Filter Radios:**
  - ◉ Both (default)
  - ○ Android Only
  - ○ iOS Only
- **Text Area:** Display formatted logs for selected event
- **Action Buttons:**
  - 📋 Copy (copy logs to clipboard)
  - ⬇️ Download JSON (export as JSON file)
  - 🖨️ Print (print logs)

**Details:**
- Populate dropdown with available events from test run
- When event is selected, fetch and display logs from backend
- Format logs as pretty-printed JSON
- Include timestamp and platform for each log entry
- Filter by selected platform
- Dynamically update text area when selections change

**Acceptance Criteria:**
- Dropdown shows all events present in test run
- Selecting event populates text area with filtered logs
- Platform filter correctly shows/hides logs
- Copy functionality places logs in clipboard
- Download creates valid JSON file
- Logs are readable and well-formatted

### FR-12: Test Execution Orchestration

**Requirement:** Coordinate all components in a complete test flow.

**Test Flow Sequence:**
1. Parse cURL and extract parameters
2. Upload app files to BrowserStack
3. Provision devices in parallel
4. Launch app on both devices
5. Automate login with provided credentials
6. Verify successful login
7. Switch app to selected state
8. Execute notification API call
9. Verify push notification on both devices
10. If checkbox enabled: Verify in-app notification centre
11. Automate tap on notification
12. Validate landing page
13. Extract logs from both devices
14. Aggregate and store logs
15. Generate and display test report

**Acceptance Criteria:**
- All steps execute in correct order
- Failures at any step are captured and reported
- Logs are collected even if some steps fail
- Test can be re-run with same session ID
- Session cleanup occurs on completion

---

## Panel UI Specifications

### Main Test Input Panel

**Layout:** Single-page form with logical sections

```
┌─────────────────────────────────────────────────────────────────┐
│              NOTIFICATION TRIGGER TEST AGENT                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📌 SECTION 1: API INPUT                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Label: "cURL / API Command"                             │   │
│  │ Input Type: Textarea                                    │   │
│  │ Placeholder: "curl -X POST https://api.example.com..."  │   │
│  │ Height: 120px                                           │   │
│  │ Features:                                               │   │
│  │  • Code highlighting (optional)                         │   │
│  │  • Paste detection                                      │   │
│  │  • Auto-extract on input                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  📌 SECTION 2: PARAMETER EXTRACTION                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Event Code: [ORDER_SHIPPED] (auto-extracted, editable)  │   │
│  │ API Method: [POST] (display-only)                       │   │
│  ��� API Endpoint: [https://...] (display-only)              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  📌 SECTION 3: TEST USER CREDENTIALS                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ User ID:      [12345                 ] *                │   │
│  │ Username:     [testuser@example.com   ] *                │   │
│  │ Password:     [••••••••••••••        ] *  (masked)      │   │
│  │ * Required fields                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  📌 SECTION 4: APP STATE AFTER LOGIN                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Select app state:                                       │   │
│  │ ◉ Foreground (App stays open)                          │   │
│  │ ○ Background (App sent to background for 10 sec)       │   │
│  │ ○ Killed (App force-closed)                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  📌 SECTION 5: NOTIFICATION VERIFICATION OPTIONS                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ☑ Check Push Notification (Always enabled)              │   │
│  │ ☑ Also check In-App Notification Centre                │   │
│  │    └─ If checked: Will navigate to notification        │   │
│  │       centre on dashboard                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [▶ START TEST]  [⏹ CANCEL]  [↻ RESET]                        │
│                                                                 │
└─────────────────────────────────────────────���───────────────────┘
```

### Field Specifications

| Field | Type | Required | Rules | Notes |
|-------|------|----------|-------|-------|
| cURL Command | Textarea | Yes | Valid cURL format | Auto-extract on paste |
| Event Code | Text Input | Yes | Alphanumeric, underscore | Auto-populated, editable |
| User ID | Text Input | Yes | Numeric or alphanumeric | Sent in API body |
| Username | Text Input | Yes | Email or alphanumeric | Used for app login |
| Password | Password Input | Yes | Any characters | Masked in UI |
| API Method | Display | No | GET, POST, PUT, DELETE | Read-only, extracted |
| API Endpoint | Display | No | Valid URL | Read-only, extracted |
| App State | Radio Buttons | Yes | Foreground, Background, Killed | Default: Foreground |
| Push Notif | Checkbox | Yes | Checked/Unchecked | Always enabled, non-editable |
| In-App Notif | Checkbox | No | Checked/Unchecked | Default: Checked |

### Form Validation

**Before Test Execution:**
- User ID: Must not be empty
- Username: Must not be empty
- Password: Must not be empty
- Event Code: Must not be empty
- cURL: Must be valid HTTP method + URL

**Error Display:**
- Show inline error messages below each field
- Highlight invalid fields with red border
- Disable START button until all required fields are valid
- Show validation errors clearly

---

## Device Setup & Management

### Device Specifications

| Aspect | Android | iOS |
|--------|---------|-----|
| Device Model | Google Pixel 8 | iPhone 15 |
| OS Version | 14.0 | 17.0 |
| Real/Emulator | Real Device | Real Device |
| Provider | BrowserStack | BrowserStack |
| Auto Permissions | Enabled | Enabled |
| Network | Real Network | Real Network |

### Device Provisioning Workflow

1. **App Upload**
   - Upload APK to BrowserStack → Get `app_url_android`
   - Upload IPA to BrowserStack → Get `app_url_ios`
   - Cache app URLs for reuse

2. **Device Session Creation**
   - Create Android session with app_url_android
   - Create iOS session with app_url_ios
   - Sessions run in parallel
   - Timeout: 60 seconds per session

3. **App Launch Verification**
   - Wait for app to start on both devices
   - Check for app home screen
   - Verify app is responsive

4. **Device Cleanup**
   - End sessions on completion
   - Release BrowserStack resources
   - Cleanup temporary files

### Capabilities Configuration

**Android:**
```json
{
  "device": "Google Pixel 8",
  "os_version": "14.0",
  "app": "bs://app-url-here",
  "autoGrantPermissions": true,
  "newCommandTimeout": 300,
  "realMobile": true
}
```

**iOS:**
```json
{
  "device": "iPhone 15",
  "os_version": "17.0",
  "app": "bs://app-url-here",
  "autoGrantPermissions": true,
  "newCommandTimeout": 300,
  "realMobile": true
}
```

---

## App State Management

### State Definitions

#### 1. Foreground
- **Definition:** App is active and visible to user
- **Implementation:** No action needed post-login
- **Notification Behavior:** 
  - May display in-app notification if foreground handling is implemented
  - Push notification may not appear (depends on app logic)
- **Use Case:** Testing in-app notification handling

#### 2. Background
- **Definition:** App is running but not visible (in background)
- **Implementation:** Call `driver.backgroundApp(10)` to send app to background for 10 seconds
- **Notification Behavior:**
  - Push notifications should appear in system notification centre
  - App may not be aware of notification until brought to foreground
- **Use Case:** Testing push notification delivery when app is backgrounded
- **Behavior:** After 10 seconds, app returns to foreground automatically (or on notification tap)

#### 3. Killed
- **Definition:** App process is terminated
- **Implementation:** Call `driver.closeApp()` to force-close the app
- **Notification Behavior:**
  - Push notifications should appear in system notification centre
  - App is completely inactive
  - For in-app centre verification: App must be relaunched
- **Use Case:** Testing notification delivery to inactive/killed apps
- **Note:** If user selects Killed state + in-app notification centre checkbox, app will be relaunched automatically for verification

### State Management Workflow

```
LOGIN SUCCESSFUL
       ↓
┌──────────────────────────────────┐
│  APP STATE SELECTION             │
│  ┌──────────────────────────────┐│
│  │ User-selected state dropdown ││
│  └──────────────────────────────┘│
└──────────────────────────────────┘
       ↓
   ┌───┴─────┬──────────┬──────────┐
   ↓         ↓          ↓          ↓
FOREGROUND  BG (10s)  KILLED      ...
   │         │         │
   │      bg Start()  closeApp()
   │         │         │
   ↓         ↓         ↓
  App      App       App
Remains   Sent to   Terminated
 Open     BG, then
         Returns
```

---

## Notification Verification

### Push Notification Verification

**Always Executed:** Yes (regardless of checkbox state)

**Detection Strategy:**
- **For Killed/Background Apps:**
  - Open system notification centre/shade
  - Search for notification by expected text/pattern
  - Extract notification title and message
  - Capture screenshot
- **For Foreground Apps:**
  - Check if notification is visible in UI
  - Log notification if visible

**Expected Behavior:**
- Notification appears within 5 seconds of API call
- Notification contains expected event details
- Notification is clickable

**Failure Handling:**
- Retry detection up to 2 times with 1-second delay
- Log as FAILED if not found after retries
- Capture device logs for debugging

### In-App Notification Centre Verification

**When Executed:** Only if checkbox is selected by user

**Navigation Steps:**
1. Bring app to foreground (if in background or killed)
2. Wait for app to stabilize (1-2 seconds)
3. Locate notification centre icon on dashboard (platform-specific selector)
4. Tap notification centre icon
5. Wait for notification centre to open (1-2 seconds)
6. Search for notification in list by content/timestamp
7. Extract notification details if found
8. Capture screenshot of notification centre

**Selectors (Platform-Specific):**
- **Android:** `~notificationCentreIcon`
- **iOS:** `~notificationCentreIcon`

**Expected Behavior:**
- Notification appears in centre list
- Notification is readable and complete
- Notification shows timestamp/date

**Failure Handling:**
- Notification centre may not be implemented
- If notification centre icon not found, log as SKIPPED
- Continue with test even if in-app centre verification fails

---

## Notification Interaction & Landing Page Validation

### Notification Tap Workflow

```
NOTIFICATION FOUND
(Push or In-App Centre)
       ↓
┌──────────────────────────────┐
│  IDENTIFY NOTIFICATION       │
│  Get locator/XPath of notif  │
└──────────────────────────────┘
       ↓
┌──────────────────────────────┐
│  TAP NOTIFICATION            │
│  driver.click(notification)  │
│  Log action with timestamp   │
└──────────────────────────────┘
       ↓
┌──────────────────────────────┐
│  WAIT FOR NAVIGATION         │
│  Timeout: 3 seconds          │
│  Poll for page change        │
└──────────────────────────────┘
       ↓
┌──────────────────────────────────────┐
│  LANDING PAGE VALIDATION             │
│  1. Check page title                 │
│  2. Verify required UI elements      │
│  3. Verify deep-link (if applicable) │
│  4. Take screenshot                  │
│  5. Log results                      │
└──────────────────────────────────────┘
       ↓
VALIDATION RESULT
(Success/Failure)
```

### Landing Page Validation Details

**Page Title Validation:**
- Get current page title
- Compare with expected title (case-insensitive substring match)
- Example: Expected "Order Details", Actual "Order Details - Naukri" → PASS

**Required UI Elements:**
- Define selector list per event code
- For each selector:
  - Locate element on page
  - Verify element is displayed (visible and not hidden)
  - Log success/failure
- All elements must be found for PASS

**Deep Link Validation:**
- Get current URL/deep link
- Extract path and query params
- Verify path contains expected pattern
- Example: Expected `/orders/`, Actual `/orders/12345` → PASS

**Timeout Handling:**
- Navigation timeout: 3 seconds
- Element check timeout: 1 second per element
- If navigation timeout exceeded: Log as FAILED, take screenshot

### Configuration Example

```json
{
  "landingPages": {
    "ORDER_SHIPPED": {
      "pageTitle": "Order Details",
      "expectedPageId": "order_details_page",
      "requiredElements": [
        "~orderTitle",
        "~orderStatus",
        "~trackingInfo",
        "~trackingNumber"
      ],
      "expectedDeepLink": "/orders/",
      "navigationTimeout": 3000
    },
    "PAYMENT_RECEIVED": {
      "pageTitle": "Payment Confirmation",
      "expectedPageId": "payment_confirmation_page",
      "requiredElements": [
        "~confirmationMessage",
        "~receiptDetails",
        "~transactionId",
        "~printButton"
      ],
      "expectedDeepLink": "/payments/",
      "navigationTimeout": 3000
    }
  }
}
```

---

## Log Extraction & Viewing

### Android Log Extraction

**Filter Command:**
```bash
adb logcat -d | grep "naukriApp.appModules.login logsUBA"
```

**Log Entry Format:**
```
MM-DD HH:MM:SS.mmm I/naukriApp.appModules.login: logsUBA: {"eventName":"communicationClick","userId":"12345","referrer":"notification",...}
```

**JSON Payload Format:**
```json
{
  "eventName": "communicationClick",
  "userId": "12345",
  "referrer": "notification",
  "timestamp": 1710594910234,
  "deepLink": "/orders/12345",
  "source": "push"
}
```

**Extraction Steps:**
1. Execute logcat command with filter
2. Parse each line for JSON payload
3. Extract JSON substring (everything after "logsUBA:")
4. Validate and parse JSON
5. Extract eventName, referrer, timestamp, payload
6. Group by eventName for display

**Events to Extract:**
- `communicationStatus` - Notification status update
- `communicationOpen` - Notification opened/viewed
- `communicationClick` - Notification clicked by user
- `appLaunch` - App launch event
- `referrer: notification` - Any event with referrer="notification"

### iOS Log Extraction

**Log Search Pattern:**
```
UBA Logs : request-->{...json...}
```

**Log Entry Format:**
```
UBA Logs : request--> {"eventName":"communicationOpen","userId":"12345","referrer":"notification",...}
```

**JSON Payload Format:**
Same as Android (see above)

**Extraction Steps:**
1. Get device logs via Appium: `driver.getLog('syslog')`
2. Search for lines containing `"UBA Logs : request-->"`
3. Extract JSON payload from matching lines
4. Parse JSON
5. Extract eventName, referrer, timestamp, payload
6. Group by eventName for display

**Events to Extract:**
Same as Android

### Log Viewer UI

**Dropdown Options:**
```
[▼ Select Event to View]
  ├─ communicationStatus
  ├─ communicationOpen
  ├─ communicationClick
  ├─ appLaunch
  └─ referrer: notification (All logs with referrer="notification")
```

**Platform Filter Radios:**
```
◉ Both (default)
○ Android Only
○ iOS Only
```

**Display Format (Text Area):**
```
[Android Device 1]
Timestamp: 2026-03-16T13:55:10.234Z
{
  "eventName": "communicationClick",
  "userId": "12345",
  "referrer": "notification",
  "deepLink": "/orders/12345",
  "timestamp": 1710594910234
}

[iOS Device 1]
Timestamp: 2026-03-16T13:55:11.567Z
{
  "eventName": "communicationClick",
  "userId": "12345",
  "referrer": "notification",
  "source": "push",
  "timestamp": 1710594911567
}
```

**Action Buttons:**
- **📋 Copy** - Copy all logs to clipboard
- **⬇️ Download JSON** - Export logs as JSON file with timestamp
- **🖨️ Print** - Print logs (browser print dialog)

**Features:**
- Real-time update when event or platform filter changes
- Pretty-printed JSON for readability
- Include timestamp and platform info
- Indicate if no logs found for selected event
- Handle errors gracefully (connection timeouts, missing data)

---

## API Integration

### Backend Endpoints

#### 1. Parse cURL Command
```
POST /api/curl/parse
Content-Type: application/json

Request:
{
  "curlCommand": "curl -X POST https://api.example.com/notify -H 'Authorization: Bearer token' -d '{...}'"
}

Response (200):
{
  "success": true,
  "parsed": {
    "method": "POST",
    "url": "https://api.example.com/notify",
    "headers": {
      "Authorization": "Bearer token",
      "Content-Type": "application/json"
    },
    "body": {
      "userId": "12345",
      "eventCode": "ORDER_SHIPPED"
    }
  }
}

Response (400):
{
  "success": false,
  "error": "Invalid cURL format"
}
```

#### 2. Start Test Session
```
POST /api/tests/start
Content-Type: application/json

Request:
{
  "userID": "12345",
  "username": "testuser@example.com",
  "password": "password123",
  "appState": "killed",
  "checkNotificationCentre": true,
  "eventCode": "ORDER_SHIPPED",
  "apiEndpoint": "https://api.example.com/notify",
  "apiMethod": "POST",
  "apiHeaders": { ... },
  "apiBody": { ... }
}

Response (200):
{
  "success": true,
  "testSessionId": "test_20260316_135022",
  "status": "initiated",
  "message": "Test session started, provisioning devices...",
  "estimatedDuration": 60000
}
```

#### 3. Get Test Status
```
GET /api/tests/{testSessionId}

Response (200):
{
  "testSessionId": "test_20260316_135022",
  "status": "running",
  "phase": "notification_verification",
  "progress": 65,
  "message": "Verifying push notification on iOS...",
  "devices": {
    "android": {
      "status": "completed",
      "phase": "landing_page_validation"
    },
    "ios": {
      "status": "running",
      "phase": "notification_verification"
    }
  }
}
```

#### 4. Get Test Results
```
GET /api/tests/{testSessionId}/results

Response (200):
{
  "testSessionId": "test_20260316_135022",
  "status": "completed",
  "summary": { ... },
  "phases": { ... },
  "logsAvailable": true
}
```

#### 5. Get Available Events
```
GET /api/logs/{testSessionId}

Response (200):
{
  "testSessionId": "test_20260316_135022",
  "availableEvents": [
    "communicationStatus",
    "communicationOpen",
    "communicationClick",
    "appLaunch",
    "referrer:notification"
  ],
  "platforms": ["android", "ios"]
}
```

#### 6. Get Filtered Logs
```
GET /api/logs/{testSessionId}/event/{eventName}?platform=both|android|ios

Response (200):
{
  "testSessionId": "test_20260316_135022",
  "selectedEvent": "communicationClick",
  "platformFilter": "both",
  "totalLogs": 2,
  "formattedLogs": "...",
  "rawLogs": [
    {
      "platform": "android",
      "timestamp": "2026-03-16T13:55:10.234Z",
      "eventName": "communicationClick",
      "referrer": "notification",
      "payload": { ... }
    },
    {
      "platform": "ios",
      "timestamp": "2026-03-16T13:55:11.567Z",
      "eventName": "communicationClick",
      "referrer": "notification",
      "payload": { ... }
    }
  ]
}
```

#### 7. Store Logs
```
POST /api/logs/{testSessionId}
Content-Type: application/json

Request:
{
  "testSessionId": "test_20260316_135022",
  "platforms": {
    "android": {
      "allLogs": [...],
      "logsByEvent": { ... }
    },
    "ios": {
      "allLogs": [...],
      "logsByEvent": { ... }
    }
  }
}

Response (200):
{
  "success": true,
  "testSessionId": "test_20260316_135022",
  "logsSummary": {
    "androidLogs": 12,
    "iosLogs": 11
  }
}
```

---

## Test Execution Flow

### Complete Test Workflow Sequence

```
1. USER INPUT
   └─ Fill panel → Click "START TEST"

2. VALIDATION
   └─ Validate all inputs, show errors if any

3. APP UPLOAD
   ├─ Upload APK → Get android_app_url
   └─ Upload IPA → Get ios_app_url

4. DEVICE PROVISIONING (Parallel)
   ├─ Android: Start session with app_url
   └─ iOS: Start session with app_url

5. APP LAUNCH
   ├─ Wait for Android app to load
   └─ Wait for iOS app to load

6. LOGIN AUTOMATION (Parallel)
   ���─ Android: Navigate to login, input username/password, submit
   └─ iOS: Navigate to login, input username/password, submit

7. LOGIN VERIFICATION
   ├─ Android: Verify home screen
   └─ iOS: Verify home screen

8. APP STATE SWITCH
   ├─ Android: Apply selected state (foreground/background/killed)
   └─ iOS: Apply selected state (foreground/background/killed)

9. NOTIFICATION TRIGGER (Parallel)
   ├─ Execute API call with userID and eventCode
   └─ Log request/response

10. PUSH NOTIFICATION VERIFICATION (Parallel)
    ├─ Android: Open notification shade → Search notification → Screenshot
    └─ iOS: Open notification centre → Search notification → Screenshot

11. IN-APP NOTIFICATION CENTRE (Parallel, if enabled)
    ├─ Android: Bring app to FG → Open centre → Verify notif → Screenshot
    └─ iOS: Bring app to FG → Open centre → Verify notif → Screenshot

12. NOTIFICATION TAP & LANDING PAGE (Parallel)
    ├─ Android: Tap notification → Wait for navigation → Validate page → Screenshot
    └─ iOS: Tap notification → Wait for navigation → Validate page → Screenshot

13. LOG EXTRACTION (Parallel)
    ├─ Android: Run logcat filter → Parse JSON → Extract logs
    └─ iOS: Get syslog → Parse JSON → Extract logs

14. LOG AGGREGATION
    └─ Combine Android and iOS logs → Group by event → Store for UI

15. REPORT GENERATION
    └─ Compile all results, screenshots, logs → Generate report

16. DEVICE CLEANUP
    ├─ End Android session
    ├─ End iOS session
    └─ Release BrowserStack resources

17. DISPLAY RESULTS
    └─ Show test summary, results panel, log viewer
```

### Error Handling Strategy

| Phase | Error | Action | Result |
|-------|-------|--------|--------|
| App Upload | Upload fails | Retry 2x, then abort | Test FAILED |
| Device Provisioning | Device unavailable | Retry 2x, then abort | Test FAILED |
| Login | Login fails | Capture screenshot, abort | Test FAILED |
| App State | State switch fails | Log warning, continue | Test CONTINUES |
| API Call | API error | Log response code, continue | Test CONTINUES |
| Push Notif | Not found | Retry 2x, then FAILED | Test CONTINUES |
| In-App Notif | Centre not found | Log as SKIPPED | Test CONTINUES |
| Landing Page | Navigation fails | Log as FAILED | Test CONTINUES |
| Log Extraction | Extract fails | Log error, continue | Test CONTINUES |

---

## Test Output & Reporting

### Test Report Structure

```json
{
  "testSessionId": "test_20260316_135022",
  "timestamp": "2026-03-16T13:50:22.000Z",
  "inputParameters": {
    "userID": "12345",
    "username": "testuser@example.com",
    "appState": "killed",
    "checkNotificationCentre": true,
    "eventCode": "ORDER_SHIPPED"
  },
  "executionPhases": {
    "appUpload": { ... },
    "deviceProvisioning": { ... },
    "login": { ... },
    "appStateSwitch": { ... },
    "notificationTrigger": { ... },
    "pushNotificationVerification": { ... },
    "inAppNotificationCentreVerification": { ... },
    "notificationTapAndLanding": { ... },
    "logExtraction": { ... }
  },
  "summary": {
    "overallStatus": "PASS",
    "totalDuration": 58000,
    "phasesCompleted": 9,
    "phasesSucceeded": 9,
    "platformResults": {
      "android": { ... },
      "ios": { ... }
    }
  },
  "logs": {
    "fullLog": "path/to/logs",
    "errorLog": null,
    "screenshotsFolder": "path/to/screenshots"
  }
}
```

### Phase-by-Phase Details

**Each phase includes:**
- Status (✅ SUCCESS, ⚠️ WARNING, ❌ FAILED)
- Duration (milliseconds)
- Timestamp
- Device-specific results
- Screenshots (where applicable)
- Error details (if failed)

### Reporting Requirements

**Generate Reports in Formats:**
1. **JSON** - Machine-readable, programmatic access
2. **HTML** - Browser-viewable with styling
3. **PDF** - Printable report with screenshots
4. **Console** - Summary output in terminal/logs

**Include in Reports:**
- Test session ID and timestamp
- Input parameters and configuration
- Phase-by-phase execution details
- Screenshots at critical phases
- Extracted logs and summaries
- Pass/fail status with reasons
- Execution time and duration
- Device information (model, OS version)
- API request/response details

---

## Configuration & Setup

### Environment Variables

```bash
# BrowserStack Configuration
BROWSERSTACK_USERNAME=your_username
BROWSERSTACK_ACCESS_KEY=your_access_key
BROWSERSTACK_HUB_URL=https://hub-cloud.browserstack.com/wd/hub
BROWSERSTACK_API_URL=https://api-cloud.browserstack.com

# App Build Paths (local or URL)
APP_BUILD_ANDROID=./app-builds/app-release.apk
APP_BUILD_IOS=./app-builds/app-release.ipa

# Alternatively, use direct download URLs
APP_BUILD_ANDROID_URL=https://example.com/app-release.apk
APP_BUILD_IOS_URL=https://example.com/app-release.ipa

# Test User Credentials (can be overridden per test)
DEFAULT_TEST_USERNAME=testuser@example.com
DEFAULT_TEST_PASSWORD=password123

# Notification API Configuration
NOTIFICATION_API_URL=https://api.example.com/notify
NOTIFICATION_API_TOKEN=your_api_token

# Server Configuration
PORT=3000
NODE_ENV=development|production

# Logging Configuration
LOG_LEVEL=debug|info|warn|error
LOG_PATH=./logs
```

### Device Configuration File

```typescript
// config/devices.config.ts

export const deviceConfig = {
  android: {
    device: "Google Pixel 8",
    osVersion: "14.0",
    realMobile: true,
    autoGrantPermissions: true,
    newCommandTimeout: 300
  },
  ios: {
    device: "iPhone 15",
    osVersion: "17.0",
    realMobile: true,
    autoGrantPermissions: true,
    newCommandTimeout: 300
  }
};
```

### Landing Page Configuration

```typescript
// config/landing-pages.config.ts

export const landingPageConfig = {
  ORDER_SHIPPED: {
    pageTitle: "Order Details",
    expectedPageId: "order_details_page",
    requiredElements: ["~orderTitle", "~orderStatus", "~trackingInfo"],
    expectedDeepLink: "/orders/",
    navigationTimeout: 3000
  },
  PAYMENT_RECEIVED: {
    pageTitle: "Payment Confirmation",
    expectedPageId: "payment_confirmation_page",
    requiredElements: ["~confirmationMessage", "~receiptDetails"],
    expectedDeepLink: "/payments/",
    navigationTimeout: 3000
  }
};
```

### Setup Instructions

**Prerequisites:**
- Node.js 16+ installed
- Python 3.8+ (for Appium)
- BrowserStack account with API credentials
- Java 8+ (for Appium server)

**Installation:**
```bash
# 1. Clone repository
git clone <repo-url>
cd notification-trigger-agent

# 2. Install dependencies
npm install

# 3. Setup Appium
npm install -g appium appium-doctor

# 4. Create .env file
cp .env.example .env
# Edit .env with your credentials

# 5. Configure device settings
cp config/devices.config.example.ts config/devices.config.ts
cp config/landing-pages.config.example.ts config/landing-pages.config.ts

# 6. Start backend server
npm run server

# 7. Start frontend (in another terminal)
npm start
```

---

## Non-Functional Requirements

### Performance Requirements

| Metric | Target | Notes |
|--------|--------|-------|
| App Upload | < 30 seconds | Per app file (APK/IPA) |
| Device Provisioning | < 60 seconds | Both devices in parallel |
| Login | < 10 seconds | Per device |
| App State Switch | < 2 seconds | All states |
| API Execution | < 5 seconds | Including response wait |
| Push Notif Detection | < 5 seconds | After API call |
| In-App Notif Check | < 5 seconds | After navigation |
| Log Extraction | < 10 seconds | Both devices |
| Total Test Duration | < 3 minutes | Complete workflow |
| Report Generation | < 10 seconds | JSON/HTML |

### Reliability Requirements

- **Retry Mechanism:** Implement exponential backoff for flaky operations
- **Max Retries:** 2 attempts for critical operations
- **Error Recovery:** Graceful degradation (continue test on non-critical failures)
- **Device Cleanup:** Always cleanup resources even on test failure
- **Log Capture:** Capture logs for all failures for debugging

### Security Requirements

- **Password Handling:** Never log passwords in plain text
- **API Tokens:** Mask API tokens in logs and UI
- **Device Access:** Use secure connections only (HTTPS)
- **BrowserStack API:** Use authentication headers securely
- **Log Storage:** Sanitize logs before storage/display

### Scalability Requirements

- **Concurrent Sessions:** Support at least 5 parallel test sessions
- **Device Pool:** Scale to 10+ simultaneous device sessions
- **Data Storage:** Logs and screenshots stored efficiently (consider compression)
- **API Rate Limiting:** Handle rate limits gracefully with backoff

### Accessibility Requirements

- **UI:** WCAG 2.1 AA compliance
- **Color Contrast:** Minimum 4.5:1 for text
- **Keyboard Navigation:** All controls accessible via keyboard
- **Screen Readers:** Proper ARIA labels and descriptions
- **Mobile Responsive:** Works on tablets and responsive layouts

---

## Glossary

| Term | Definition |
|------|-----------|
| **Appium** | Open-source automation framework for mobile apps |
| **BrowserStack** | Cloud platform for testing on real devices |
| **Deep Link** | URL that links directly to specific content in app |
| **Event Code** | Identifier for notification event type (e.g., ORDER_SHIPPED) |
| **In-App Notification Centre** | Dashboard feature showing accumulated notifications |
| **Logcat** | Android logging system output |
| **Push Notification** | Message delivered by OS (not in-app) |
| **Referrer** | Source of action/notification (e.g., "notification") |
| **Session ID** | Unique identifier for test execution |
| **Test Session** | Single complete test run from input to report |
| **UBA Logs** | User Behavioral Analytics logs (iOS) |
| **WebdriverIO** | JavaScript automation framework (alternative to Appium) |

---

## Appendix: Example Test Scenarios

### Scenario 1: Order Shipped Notification (App Killed)

**Input:**
- User ID: 12345
- Username: testuser@example.com
- App State: Killed
- Check Notification Centre: Yes
- Event Code: ORDER_SHIPPED

**Expected Flow:**
1. App installed and launched
2. User logged in successfully
3. App force-closed
4. API called to send ORDER_SHIPPED notification
5. Push notification appears in system notification centre
6. App relaunched, notification centre verified
7. Notification tapped → Navigates to Order Details page
8. All required elements verified on landing page
9. Logs extracted showing communicationClick event with referrer="notification"

**Expected Result:** ✅ PASS

---

### Scenario 2: Payment Notification (App Backgrounded)

**Input:**
- User ID: 54321
- Username: anotheruser@example.com
- App State: Background
- Check Notification Centre: No
- Event Code: PAYMENT_RECEIVED

**Expected Flow:**
1. App installed and launched
2. User logged in
3. App sent to background
4. API called to send PAYMENT_RECEIVED notification
5. Push notification appears (in-app centre not checked)
6. Notification tapped → Navigates to Payment Confirmation page
7. Required elements verified
8. Logs extracted showing relevant events

**Expected Result:** ✅ PASS

---

### Scenario 3: Promotion Notification (App Foreground)

**Input:**
- User ID: 99999
- Username: promotiontest@example.com
- App State: Foreground
- Check Notification Centre: Yes
- Event Code: PROMOTION_AVAILABLE

**Expected Flow:**
1. App remains open in foreground
2. API called
3. Notification may appear as in-app banner or notification centre
4. Both push and in-app centre verified
5. Navigation to Promotions page
6. Elements verified
7. Logs show appLaunch and communicationOpen events

**Expected Result:** ✅ PASS (with notes on foreground handling)

---

**Document Version:** 1.0  
**Last Updated:** 2026-03-16  
**Status:** Final

---

EOF
