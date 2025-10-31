// types.ts

import React from "react";

export interface CatImage {
  id: number;
  url: string;
  theme: string;
  rarity: 'common' | 'rare' | 'epic';
  isShiny?: boolean;
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

export type EnvelopeTypeId = 'bronze' | 'silver' | 'gold' | string;

export interface Envelope {
  id: EnvelopeTypeId;
  name: string;
  baseCost: number;
  costIncreasePerLevel: number;
  imageCount: number;
  color: string;
  description: string;
  xp: number;
  isFeatured?: boolean;
  catThemePool: string[];
}

export type UpgradeId = 'goldenPaw' | 'betterBait' | 'extraTime' | string;

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
  fromUserProfilePictureUrl?: string;
  toUserId: string;
  toUsername: string;
  toUserVerified: boolean;
  toUserProfilePictureUrl?: string;
  offeredImages: CatImage[];
  requestedImages: CatImage[];
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: string; // ISO string
}

// --- Friendship & Missions ---
export interface Mission {
    missionId: string;
    progress: number;
    goal: number;
    isCompleted: boolean;
}

export interface Friendship {
    _id: string; // MongoDB ObjectId as a string
    userId: string;
    level: number;
    xp: number;
    activeMission: Mission | null;
}

export interface UserData {
    coins: number;
    phrases: Phrase[];
    unlockedImageIds: number[];
    playerStats: PlayerStats;
    purchasedUpgrades: UpgradeId[];
    bio: string;
    profilePictureId: number | null;
    friendships: Friendship[];
    friendRequestsSent: string[]; // array of user IDs
    friendRequestsReceived: string[]; // array of user IDs
    tradeNotifications: number;
    friends?: string[]; // Old structure, for migration purpose
}

export interface UserProfile {
  id: string;
  username: string;
  role: 'admin' | 'mod' | 'user';
  isVerified: boolean;
  profilePictureUrl?: string;
  data: UserData;
}


// --- Game Center Types ---
export interface GameProps {
  unlockedImages: CatImage[];
  onGameEnd: (results: { score: number; coinsEarned: number; xpEarned: number }) => void;
}

export interface Game {
  id: string;
  name: string;
  category: 'Asociación y memoria' | 'Creatividad y expresión' | 'Sonidos y reconocimiento' | 'Aprendizaje y lógica' | 'Mini-juegos más dinámicos';
  description: string;
  component: React.FC<GameProps>;
  minImagesRequired?: number;
  icon: React.ReactNode;
}


// --- Admin Panel Types ---
export interface AdminUserView {
    id: string;
    username: string;
    role: 'admin' | 'mod' | 'user';
    isVerified: boolean;
    profilePictureUrl?: string;
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
    profilePictureUrl?: string;
}

export interface PublicProfilePhrase {
    publicPhraseId: string;
    text: string;
    imageUrl: string;
    imageTheme: string;
    likeCount: number;
    isLikedByMe: boolean;
    userId: string;
    // Optional fields for when phrase is part of a feed
    username?: string;
    isUserVerified?: boolean;
    profilePictureUrl?: string;
}

export interface PublicProfileData {
    userId: string;
    username: string;
    role: 'admin' | 'mod' | 'user';
    isVerified: boolean;
    bio: string;
    profilePictureUrl?: string;
    phrases: PublicProfilePhrase[];
    unlockedImages: CatImage[];
}

export interface Friend {
    userId: string;
    username: string;
    isVerified: boolean;
    role: 'admin' | 'mod' | 'user';
    profilePictureUrl?: string;
    friendship: Friendship | null; // Detailed friendship data
}

export interface FriendRequest {
    userId: string;
    username: string;
    profilePictureUrl?: string;
}

export interface FriendData {
    friends: Friend[];
    requests: FriendRequest[];
}

export interface FullDisplayData {
  phrase: Phrase;
  image: CatImage | null;
}