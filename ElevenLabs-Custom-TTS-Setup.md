# ElevenLabs Custom TTS Model Setup

This guide shows how to integrate your custom ElevenLabs TTS model into Vocab.

## Prerequisites

You need:

- Your ElevenLabs API key
- Your custom Voice ID
- Your custom Model ID (e.g., `custom_model_12345` or the model slug)

## Setup Steps

### 1. Add Credentials to `.env`

Open `.env` and fill in your custom TTS details:

```env
# Your ElevenLabs API key (required)
EXPO_PUBLIC_ELEVENLABS_API_KEY=your_api_key_here

# Your custom voice ID (from your ElevenLabs account)
EXPO_PUBLIC_ELEVENLABS_CUSTOM_VOICE_ID=your_custom_voice_id

# Your custom model ID (e.g., "custom_model_abc123" or a public model like "turbo_v2_5")
EXPO_PUBLIC_ELEVENLABS_CUSTOM_MODEL_ID=your_custom_model_id
```

### 2. How It Works

- When a user has `voiceStyleId` set to your custom voice ID, the app will automatically use your custom model
- If the voice ID doesn't match your custom voice, it falls back to the default `eleven_turbo_v2_5` model
- The model intelligently detects custom voices and applies the right model

### 3. Set Custom Voice as User's Default

The system uses the `voiceStyleId` from the user's profile. To make all users default to your custom voice:

Option A: Set it during onboarding (update your signup flow):

```typescript
const user = {
  voiceStyleId: process.env.EXPO_PUBLIC_ELEVENLABS_CUSTOM_VOICE_ID!,
  // ... other user fields
};
```

Option B: Add a constant in `src/constants/`:

```typescript
// src/constants/tts.ts
export const DEFAULT_VOICE_ID =
  process.env.EXPO_PUBLIC_ELEVENLABS_CUSTOM_VOICE_ID ||
  "some_fallback_voice_id";
```

Then use it in signup:

```typescript
const user = {
  voiceStyleId: DEFAULT_VOICE_ID,
  // ... other user fields
};
```

### 4. Verify It's Working

In `useAudio.ts`, the custom model will be automatically selected when:

1. User's `voiceStyleId` matches `CUSTOM_VOICE_ID`
2. Both `CUSTOM_VOICE_ID` and `CUSTOM_MODEL_ID` are set in `.env`

You can verify by:

- Playing any audio-based exercise
- Checking browser DevTools Network tab → ElevenLabs requests should show your model ID in the request body
- Listening for quality differences (custom models usually have better naturalness)

### 5. Testing

```typescript
// In any component or hook:
import {
  isCustomModelConfigured,
  getCustomVoiceId,
} from "@services/ttsService";

if (isCustomModelConfigured()) {
  console.log("✅ Custom model is ready:", getCustomVoiceId());
} else {
  console.log("⚠️ Custom model not configured, using default");
}
```

## Advanced: Override Model Per Call

You can also override the model on a per-call basis if needed:

```typescript
// In useAudio.ts or any component using generateSpeech:
import { generateSpeech } from "@services/ttsService";

await generateSpeech(text, voiceId, {
  modelId: "your_specific_model_id",
});
```

## Troubleshooting

| Issue                                 | Solution                                                                                                        |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| "API key is empty"                    | Make sure `EXPO_PUBLIC_ELEVENLABS_API_KEY` is set in `.env`                                                     |
| 401 Unauthorized                      | Verify your API key is correct in `.env`                                                                        |
| 404 Voice not found                   | Double-check your custom voice ID in ElevenLabs dashboard                                                       |
| Using default model instead of custom | Check that `CUSTOM_VOICE_ID` and `CUSTOM_MODEL_ID` are set, and user's `voiceStyleId` matches `CUSTOM_VOICE_ID` |

## ElevenLabs API Reference

For more details, see: https://elevenlabs.io/docs/api-reference
