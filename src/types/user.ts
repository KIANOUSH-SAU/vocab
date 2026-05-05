import type { Level } from "./word";

export interface User {
  id: string;
  name: string;
  email?: string;
  level: Level;
  voiceStyleId: string;
  isGuest: boolean;
  streak?: number;
  lastActiveDate?: string | null;
  avatarFileId?: string | null;
}

export interface VoiceStyle {
  id: string;
  name: string;
  previewUrl?: string;
  category: string;
}
