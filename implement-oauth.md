# OAuth2 Integration Setup Guide (Google & Apple)

To get OAuth working with Appwrite and Expo, there are two distinct parts:

1. Setting up the OAuth providers (Google Cloud Console / Apple Developer Portal) to get the keys for the Appwrite dashboard.
2. Hooking up the React Native code to trigger the login flow.

---

## Part 1: Filling out the Appwrite Dashboard Modals

### Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., "Vocab App").
3. Navigate to **APIs & Services > Credentials**.
4. Click **Create Credentials** -> **OAuth client ID**.
5. Set the Application type to **Web application** (Important: select Web, _not_ iOS/Android, because Appwrite handles the web-based handshake).
6. Under **Authorized redirect URIs**, copy and paste the `URI` listed at the bottom of your Google OAuth2 settings modal in Appwrite (the one ending in `.../callback/google/...`).
7. Click Save. Google will give you a **Client ID** and a **Client Secret**.
8. Go back to Appwrite:
   - Paste the Google Client ID into **App ID**.
   - Paste the Google Client Secret into **App Secret**.
   - Enable the switch and click Update.

### Apple OAuth Setup

1. Go to your [Apple Developer Member Center](https://developer.apple.com/account).
2. Go to **Certificates, Identifiers & Profiles**.
3. Create a **Services ID** (under Identifiers). E.g., `com.yourcompany.vocab.signin`.
   - Check the box for "Sign in with Apple".
   - Configure it by eering the Appwrite return URI from the bottom of your Appwrite Apple modal into "Return URLs".
   - Enter your Appwrite instance domain (e.g., `fra.cloud.appwrite.io`) into "Domains and Subdomains".
   - Save. **Copy this Services ID**. Paste it into the Appwrite **Services ID** field.
4. Go to **Keys**. Create a new key.
   - Name it "Vocab Auth".
   - Check "Sign in with Apple", click Configure, and map it to your main App ID.
   - Save and Download the `.p8` file securely.
   - **Important:** Open that `.p8` file in a text editor. Copy the _entire contents_ (including `-----BEGIN PRIVATE KEY-----`) and paste it into the **P8 File** box in Appwrite.
5. In Apple Developer, find the 10-character ID of the Key you just downloaded. Paste it into Appwrite's **Key ID**.
6. Find your 10-character Apple Developer **Team ID** (usually listed in your membership details). Paste it into **Team ID**.
7. Enable the switch and click Update.

---

## Part 2: Implementation in React Native (Expo)

Once the dashboard is configured, you need to set up the Expo code to trigger `account.createOAuth2Session`.

### 1. Configure the app.json Scheme

Since Appwrite will bounce the user to the web browser to sign in, it needs to know how to "bounce back" to your app. Ensure `app.json` has a deep linking scheme:

```json
{
  "expo": {
    "scheme": "vocabapp"
  }
}
```

### 2. Implement the Logic for Claude

In `signup.tsx` or `login.tsx`, Claude should implement:

```javascript
import { account } from "@services/appwrite";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

// Tells Expo not to dismiss the browser automatically if not needed
WebBrowser.maybeCompleteAuthSession();

const handleOAuth = async (provider) => {
  try {
    // Generate valid return URIs for Expo Go / Build
    const redirectUrl = makeRedirectUri({
      path: "/(tabs)/home", // The screen they land on
    });

    // Generate the Appwrite login URL
    const loginUrl = await account.createOAuth2Token(
      provider, // 'google' or 'apple'
      redirectUrl, // Success url
      redirectUrl, // Failure url (can route to a failure screen instead)
    );

    // Prompt the web-browser to open that URL
    const result = await WebBrowser.openAuthSessionAsync(
      loginUrl.toString(),
      redirectUrl,
    );

    // If successful, Appwrite has automatically established a session for this device!
    // We just fetch their profile and inject into Zustand.
    if (result.type === "success") {
      const user = await account.get();
      // Handle the rest of the Zustand sync logic ...
    }
  } catch (error) {
    console.error("OAuth fail:", error);
  }
};
```
