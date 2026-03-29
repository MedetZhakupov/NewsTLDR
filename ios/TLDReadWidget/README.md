# TLDRead

An iOS app with a home screen widget that generates AI-powered TLDR summaries of your Gmail newsletters using the Anthropic API (Claude).

## Features

- **Gmail Integration**: Sign in with Google to access your newsletters (read-only)
- **Smart Sender Discovery**: Automatically detects newsletter senders from your inbox
- **AI Summaries**: Generates concise 2-3 sentence TLDRs using Claude (claude-sonnet-4-20250514)
- **Home Screen Widget**: Small, medium, and large widgets showing your latest newsletter summaries
- **Privacy First**: Gmail data processed on-device, API key stored in iOS Keychain

## Setup

### Prerequisites

1. **Xcode 15+** with iOS 17 SDK
2. **Google Cloud Console** project with Gmail API enabled
3. **Anthropic API key** from [console.anthropic.com](https://console.anthropic.com)

### Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Enable the **Gmail API**
4. Create an **OAuth 2.0 Client ID** for iOS
   - Bundle ID: `com.medetzhakupov.TLDRead`
5. Download the `GoogleService-Info.plist`
6. Copy the **Client ID** and update `TLDRead/Info.plist`:
   - Replace `YOUR_CLIENT_ID.apps.googleusercontent.com` with your Client ID
   - Replace `com.googleusercontent.apps.YOUR_CLIENT_ID` with the reversed Client ID

### Build & Run

1. Open `TLDRead.xcodeproj` in Xcode
2. Wait for Swift Package Manager to resolve `GoogleSignIn-iOS`
3. Select your development team in Signing & Capabilities
4. Ensure App Groups capability is configured: `group.com.medetzhakupov.TLDRead`
5. Build and run on a device or simulator

### In-App Setup

1. **Sign in** with your Google account (grants read-only Gmail access)
2. Go to **Settings** and enter your **Anthropic API key**
3. Go to **Senders** tab and select which newsletters to track
4. Return to **TLDRs** tab and pull to refresh

### Adding the Widget

1. Long-press your home screen
2. Tap the **+** button
3. Search for **TLDRead**
4. Choose Small, Medium, or Large widget
5. The widget updates based on your configured refresh interval

## Architecture

```
User opens app
  → Google Sign-In (OAuth2, gmail.readonly scope)
  → Gmail API fetches newsletters from tracked senders
  → Anthropic API generates TLDRs (on-device calls)
  → Results cached in App Group UserDefaults
  → Widget reads cached data via TimelineProvider
```

## Security

- **Anthropic API key**: Stored in iOS Keychain, never in UserDefaults or source code
- **Gmail tokens**: Managed by Google Sign-In SDK with Keychain storage
- **App Group data**: Only contains non-sensitive cached TLDR summaries
- **Network**: All API calls over HTTPS (enforced by App Transport Security)

## Project Structure

```
TLDRead/
├── TLDRead/              # Main iOS app
│   ├── Services/         # API clients (Gmail, Anthropic, Keychain)
│   ├── ViewModels/       # MVVM view models
│   └── Views/            # SwiftUI views
├── TLDReadWidget/        # WidgetKit extension
│   └── Views/            # Small, Medium, Large widget views
└── Shared/               # Models shared between app & widget
```

## License

MIT
