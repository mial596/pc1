// api/_shared/data.ts
import { Phrase, PlayerStats, UpgradeId, UserData } from '../../types.js';

// Backend constants
const INITIAL_PHRASES: Phrase[] = [
  { id: 'yes', text: 'Sí', selectedImageId: null, isCustom: false, isPublic: false },
  { id: 'no', text: 'No', selectedImageId: null, isCustom: false, isPublic: false },
  { id: 'happy', text: 'Me siento feliz', selectedImageId: null, isCustom: false, isPublic: false },
  { id: 'sad', text: 'Me siento triste', selectedImageId: null, isCustom: false, isPublic: false },
  { id: 'help', text: 'Necesito ayuda', selectedImageId: null, isCustom: false, isPublic: false }
];

const INITIAL_UNLOCKED_IMAGE_IDS: number[] = [];

// Backend function to generate initial user data
export const getInitialUserData = (): Omit<UserData, 'phrases' | 'unlockedImageIds'> & { phrases: Phrase[], unlockedImageIds: number[] } => ({
    phrases: INITIAL_PHRASES.map(p => ({ ...p })), // Ensure a fresh copy is returned
    coins: 500,
    unlockedImageIds: [...INITIAL_UNLOCKED_IMAGE_IDS],
    playerStats: { level: 1, xp: 0, xpToNextLevel: 100 },
    purchasedUpgrades: [],
    bio: "¡Hola! Soy nuevo en PictoCat.",
    friendships: [],
    friends: [],
    friendRequestsSent: [],
    friendRequestsReceived: [],
    tradeNotifications: 0,
    dailyMissions: [],
    lastMissionReset: new Date(0).toISOString(), // A very old date to trigger initial reset
});