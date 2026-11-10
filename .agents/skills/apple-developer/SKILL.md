---
name: apple-developer
description: Apple ecosystem and iOS/macOS engineering. Covers Apple Developer Program provisioning, App Store Review Guidelines compliance, App Sandbox entitlements, Hardened Runtime, notarization CLI, TestFlight, and Xcode automation.
---

# Apple Ecosystem & iOS/macOS Engineering

This skill provides exhaustive guidance on developing, notarizing, testing, and publishing applications for iOS, macOS, watchOS, and iPadOS within the Apple Developer ecosystem.

---

## 1. App Store Review Guidelines Compliance

Avoid the most common Apple App Store rejection triggers:
- **Guideline 2.1 (Performance - App Completeness)**: Apps must not contain placeholder text, "lorem ipsum", dead links, or crash upon launch.
- **Guideline 3.1.1 (In-App Purchase)**: Digital goods, unlocks, subscriptions, and virtual currencies must utilize Apple StoreKit 2 IAP. Physical goods/services may use Stripe/credit cards.
- **Guideline 4.0 (Design)**: Follow Apple Human Interface Guidelines (HIG). Apps must support Dark Mode cleanly and provide iPad/Mac layout adaptability if universal.
- **Guideline 5.1.1 (Data Collection & Privacy)**:
  - Provide complete App Privacy Nutrition Labels in App Store Connect.
  - Implement App Tracking Transparency (`ATTrackingManager`) before accessing the IDFA.
  - Mandatory "Sign in with Apple" if using any third-party social login (Google, Facebook), unless using dedicated enterprise corporate SSO.

---

## 2. macOS Hardened Runtime & Notarization via CLI

Distributing macOS applications outside the Mac App Store requires code signing with a Developer ID Application certificate and notarization with Apple's ticket service:

### Signing with Hardened Runtime & Entitlements
```bash
# Sign native application bundle
codesign --deep --force --verify --verbose \
  --options runtime \
  --entitlements App.entitlements \
  --sign "Developer ID Application: Your Company LLC (TEAMID)" \
  "build/Release/Recode.app"

# Verify signature integrity
codesign --verify --deep --strict --verbose=2 "build/Release/Recode.app"
spctl -a -vvv -t execute "build/Release/Recode.app"
```

### Apple `notarytool` Automated Submission
```bash
# Package into ZIP or DMG
ditto -c -k --keepParent "build/Release/Recode.app" "Recode.zip"

# Submit to Apple Notary Service using App Store Connect API Key
xcrun notarytool submit "Recode.zip" \
  --key "/path/to/AuthKey_XXXXXXXXXX.p8" \
  --key-id "XXXXXXXXXX" \
  --issuer "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" \
  --wait

# Staple notarization ticket to the app bundle
xcrun stapler staple "build/Release/Recode.app"
```

---

## 3. StoreKit 2 Modern In-App Purchase Architecture

Implement Swift StoreKit 2 with async/await and cryptographic signature verification:

```swift
import StoreKit

@MainActor
public class SubscriptionManager: ObservableObject {
    @Published private(set) var hasProAccess = false

    public func listenForTransactions() -> Task<Void, Error> {
        return Task.detached {
            for await result in Transaction.updates {
                do {
                    let transaction = try self.checkVerified(result)
                    await self.updatePurchasedIdentifiers(transaction)
                    await transaction.finish()
                } catch {
                    print("Transaction verification failed: \(error)")
                }
            }
        }
    }

    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified(_, let error):
            throw error
        case .verified(let safe):
            return safe
        }
    }
}
```

---

## 4. Apple Developer Checklist

- [ ] **Privacy Manifest (`PrivacyInfo.xcprivacy`)**: Declare required reason APIs (user defaults, disk space, file timestamps, system boot time) introduced in iOS 17 / macOS 14.
- [ ] **App Sandbox Enabled**: For Mac App Store targets, verify `com.apple.security.app-sandbox` entitlement is set to `YES`.
- [ ] **TestFlight Internal & External Groups**: Ensure compliance with export compliance regulations (encryption question answered in App Store Connect).
