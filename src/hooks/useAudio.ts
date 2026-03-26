import { useState, useCallback, useRef, useEffect } from "react";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import { generateSpeech } from "@services/ttsService";
import { useCurrentUser } from "@store/userStore";
import { useWordStore } from "@store/wordStore";

type AudioState = "idle" | "loading" | "playing" | "error";

interface UseAudioReturn {
  state: AudioState;
  play: (text: string, cacheKey?: string) => Promise<void>;
  stop: () => void;
  replay: () => void;
}

export function useAudio(): UseAudioReturn {
  const [audioState, setAudioState] = useState<AudioState>("idle");
  const soundRef = useRef<Audio.Sound | null>(null);
  const lastTextRef = useRef<string>("");
  const user = useCurrentUser();
  const { audioCache, cacheAudio } = useWordStore();

  // Configure default audio behavior so the iOS mute switch doesn't block playback
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    }).catch(console.warn);
  }, []);

  const stop = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    Speech.stop(); // Also tell expo-speech to stop immediately
    setAudioState("idle");
  }, []);

  const play = useCallback(
    async (text: string, cacheKey?: string) => {
      await stop();
      lastTextRef.current = text;
      setAudioState("loading");

      try {
        const voiceId = user?.voiceStyleId;
        const key = cacheKey ?? `tts-${text.slice(0, 20)}`;
        let uri = cacheKey ? audioCache[key] : undefined;

        if (!uri && voiceId) {
          try {
            uri = await generateSpeech(text, voiceId);
            if (cacheKey && uri) cacheAudio(key, uri);
          } catch (err) {
            console.warn(
              "[Audio] HTTP TTS generation failed, falling back to local.",
              err,
            );
            uri = undefined;
          }
        }

        if (uri) {
          console.log("[Audio] Playing file URI via expo-av");
          const { sound } = await Audio.Sound.createAsync(
            { uri },
            { shouldPlay: true },
          );
          soundRef.current = sound;
          sound.setOnPlaybackStatusUpdate((status: any) => {
            if (status.isLoaded && status.didJustFinish) setAudioState("idle");
          });
          setAudioState("playing");
        } else {
          // Fallback to device TTS
          console.log(`[Audio] Playing raw text via expo-speech: "${text}"`);
          setAudioState("playing");
          Speech.speak(text, {
            onDone: () => setAudioState("idle"),
            onError: (err) => {
              console.error("[Audio] expo-speech failed:", err);
              setAudioState("error");
            },
          });
        }
      } catch (err) {
        console.error("[Audio] Fatal playback error:", err);
        setAudioState("error");
      }
    },
    [user, audioCache, cacheAudio, stop],
  );

  const replay = useCallback(() => {
    if (lastTextRef.current) play(lastTextRef.current);
  }, [play]);

  return { state: audioState, play, stop, replay };
}
