// types.ts

export interface CatImage {
  id: number;
  url: string;
  theme: string;
  rarity: 'common' | 'rare' | 'epic';
}

export interface Phrase {
  id: string;
  text: string;
  selectedImageId: number | null;
  isCustom: boolean;
  isPublic: boolean;
}

export interface PlayerStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
}

export type EnvelopeTypeId = 'bronze' | 'silver' | 'gold';

export interface Envelope {
  id: EnvelopeTypeId;
  name: string;
  baseCost: number;
  costIncreasePerLevel: number;
  imageCount: number;
  color: string;
  description: string;
  xp: number;
}

export type UpgradeId = 'goldenPaw' | 'betterBait' | 'extraTime';

export interface GameUpgrade {
    id: UpgradeId;
    name: string;
    description: string;
    cost: number;
    levelRequired: number;
    icon: 'coin' | 'mouse' | 'time';
}

export interface TradeOffer {
  _id: string; // from MongoDB
  fromUserId: string;
  fromUsername: string;
  fromUserVerified: boolean;
  toUserId: string;
  toUsername: string;
  toUserVerified: boolean;
  offeredImages: CatImage[];
  requestedImages: CatImage[];
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: string; // ISO string
}


export interface UserData {
    coins: number;
    phrases: Phrase[];
    unlockedImageIds: number[];
    playerStats: PlayerStats;
    purchasedUpgrades: UpgradeId[];
    bio: string;
    friends: string[]; // array of user IDs
    friendRequestsSent: string[]; // array of user IDs
    friendRequestsReceived: string[]; // array of user IDs
    tradeNotifications: number;
}

export interface UserProfile {
  id: string;
  email: string; // This is actually the username
  role: 'admin' | 'mod' | 'user';
  isVerified: boolean;
  data: UserData;
}

// --- Game Modes ---
interface BaseGameMode {
  gameId: 'mouseHunt' | 'catMemory' | 'simonSays' | 'catTrivia' | 'felineRhythm';
  id: string; // e.g., 'mouseHunt-easy'
  name: string; // e.g., 'Fácil'
  description: string;
}

export interface MouseHuntMode extends BaseGameMode {
  gameId: 'mouseHunt';
  gridSize: number;
  mouseDuration: number;
  gameDuration: number;
  maxMice: number;
  rewardMultiplier: number;
}

export interface CatMemoryMode extends BaseGameMode {
    gameId: 'catMemory';
    pairCount: number;
    gameDuration: number;
    rewardPerPair: number;
    minImagesRequired: number;
}

export interface SimonSaysMode extends BaseGameMode {
    gameId: 'simonSays';
    gameDuration: number;
    initialSequenceLength: number;
    speedMs: number;
    rewardPerRound: number;
}

export interface CatTriviaMode extends BaseGameMode {
    gameId: 'catTrivia';
    gameDuration: number;
    questionCount: number;
    timePerQuestion: number;
    rewardPerCorrect: number;
    minImagesRequired: number;
}

export interface FelineRhythmMode extends BaseGameMode {
    gameId: 'felineRhythm';
    gameDuration: number;
    noteCount: number;
    rewardMultiplier: number;
}

export type GameMode = MouseHuntMode | CatMemoryMode | SimonSaysMode | CatTriviaMode | FelineRhythmMode;


// --- Admin Panel Types ---
export interface AdminUserView {
    id: string;
    email: string; // This is username
    role: 'admin' | 'mod' | 'user';
    isVerified: boolean;
}

export interface PublicPhrase {
    publicPhraseId: string;
    userId: string;
    email: string; // Username of creator
    text: string;
    imageUrl: string;
    imageTheme: string;
}

// --- Community/Public Profile Types ---

export interface SearchableUser {
    username: string;
    isVerified: boolean;
}

export interface PublicProfilePhrase {
    publicPhraseId: string;
    text: string;
    imageUrl: string;
    imageTheme: string;
    likeCount: number;
    isLikedByMe: boolean;
    // Optional fields for when phrase is part of a feed
    username?: string;
    isUserVerified?: boolean;
}

export interface PublicProfileData {
    userId: string;
    username: string;
    role: 'admin' | 'mod' | 'user';
    isVerified: boolean;
    bio: string;
    phrases: PublicProfilePhrase[];
    unlockedImages: CatImage[];
}

export interface Friend {
    userId: string;
    username: string;
    isVerified: boolean;
    role: 'admin' | 'mod' | 'user';
}

export interface FriendRequest {
    userId: string;
    username: string;
}

export interface FriendData {
    friends: Friend[];
    requests: FriendRequest[];
}

// FIX: Add missing FullDisplayData interface to fix import error in App.tsx.
export interface FullDisplayData {
  phrase: Phrase;
  image: CatImage | null;
}