---
name: google-developer
description: Google ecosystem developer engineering. Covers Google Cloud Platform (GCP) APIs, Android App Bundles (AAB), Google Play Console policy compliance, Google Identity Services (OAuth 2.0/OIDC), and Google Developer APIs.
---

# Google Ecosystem & Android Developer Engineering

This skill provides exhaustive guidance on developing, certifying, and publishing software within the Google ecosystem, including Android App Bundles, Google Play policy compliance, Google Cloud Platform integrations, and Google Identity Services.

---

## 1. Android App Bundle (AAB) & Google Play Publishing

### AAB Architecture & Dynamic Feature Delivery
Google Play requires `.aab` format over monolithic `.apk`. The Google Play backend generates device-optimized APK splits (base APK + config APKs for ABI, screen density, language).

#### Gradle Release Signing Configuration
```groovy
// app/build.gradle
android {
    signingConfigs {
        release {
            storeFile file(System.getenv("ANDROID_KEYSTORE_PATH") ?: "release.keystore")
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEY_PASSWORD")
            enableV3Signing true
            enableV4Signing true
        }
    }
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
    }
}
```

### Google Play Console Policy Compliance
- **Target API Level**: Target API level must be within one level of the latest Android release (API 34+ for 2024/2025 releases).
- **Data Safety Declaration**: Disclose all data types collected, shared, or linked to user identity (e.g., location, crash logs, financial data).
- **Exact Alarms & Permissions**: Declare `POST_NOTIFICATIONS` explicitly for Android 13+. Only request `SCHEDULE_EXACT_ALARM` if building an alarm clock or calendar application.
- **Account Deletion Requirement**: Apps that support account creation must provide an in-app path and an accessible web link for complete account and data deletion.

---

## 2. Google Identity Services (GIS) & OAuth 2.0 Integration

Integrate the modern Google Identity Services SDK for Web and Android:

```html
<!-- Modern GIS Client-side Integration -->
<script src="https://accounts.google.com/gsi/client" async defer></script>
<div id="g_id_onload"
     data-client_id="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
     data-context="signin"
     data-ux_mode="popup"
     data-callback="handleCredentialResponse"
     data-auto_select="true">
</div>
<div class="g_id_signin" data-type="standard"></div>

<script>
  function handleCredentialResponse(response) {
    // response.credential is a cryptographically signed JWT ID Token
    verifyTokenOnBackend(response.credential);
  }
</script>
```

#### Backend Verification with Google Auth Library (Python)
```python
from google.oauth2 import id_token
from google.auth.transport import requests

def verify_google_token(token_string: str, client_id: str) -> dict:
    try:
        idinfo = id_token.verify_oauth2_token(
            token_string, 
            requests.Request(), 
            client_id
        )
        # Verify issuer is Google
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')

        user_id = idinfo['sub']
        user_email = idinfo['email']
        return idinfo
    except ValueError as e:
        raise AuthenticationError(f"Invalid Google ID token: {e}")
```

---

## 3. Google Cloud Service Accounts & IAM

When accessing Google Cloud services (Storage, Cloud Run, Vertex AI) from backends:
- Use **Application Default Credentials (ADC)** or Workload Identity Federation rather than hardcoding static JSON service account keys.
- Grant granular predefined IAM roles (e.g., `roles/storage.objectViewer` instead of `roles/storage.admin`).

---

## 4. Google Developer Checklist

- [ ] **ProGuard/R8 Optimization**: Verify obfuscation maps (`mapping.txt`) are retained and uploaded to Play Console for de-obfuscating crash stack traces.
- [ ] **Privacy Policy Link**: Ensure an active, publicly accessible privacy policy URL is linked in Play Console and inside the application settings.
- [ ] **OAuth Consent Verification**: Complete Google Brand Verification and scope verification if requesting sensitive scopes (`drive`, `gmail`, `calendar`).
