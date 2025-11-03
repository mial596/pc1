// api/_shared/data.ts
import { Phrase, PlayerStats, UpgradeId, UserData } from '../../types.js';

// Backend constants
// FIX: Add missing properties 'visibility' and 'isArchived' to each Phrase object to conform to the type definition.
const INITIAL_PHRASES: Phrase[] = [
  { id: 'yes', text: 'Sí', selectedImageId: null, isCustom: false, visibility: 'private', isArchived: false },
  { id: 'no', text: 'No', selectedImageId: null, isCustom: false, visibility: 'private', isArchived: false },
  { id: 'happy', text: 'Me siento feliz', selectedImageId: null, isCustom: false, visibility: 'private', isArchived: false },
  { id: 'sad', text: 'Me siento triste', selectedImageId: null, isCustom: false, visibility: 'private', isArchived: false },
  { id: 'help', text: 'Necesito ayuda', selectedImageId: null, isCustom: false, visibility: 'private', isArchived: false }
];

const INITIAL_UNLOCKED_IMAGE_IDS: number[] = [];

// Backend function to generate initial user data
// FIX: Add missing 'folders' property to conform to the UserData type.
export const getInitialUserData = (): Omit<UserData, 'phrases' | 'unlockedImageIds'> & { phrases: Phrase[], unlockedImageIds: number[] } => ({
    phrases: INITIAL_PHRASES.map(p => ({ ...p })), // Ensure a fresh copy is returned
    coins: 500,
    folders: [],
    unlockedImageIds: [...INITIAL_UNLOCKED_IMAGE_IDS],
    playerStats: { level: 1, xp: 0, xpToNextLevel: 100 },
    purchasedUpgrades: [],
    bio: "¡Hola! Soy nuevo en PictoCat.",
    profilePictureId: null,
    friendships: [],
    friends: [],
    friendRequestsSent: [],
    friendRequestsReceived: [],
    tradeNotifications: 0,
});