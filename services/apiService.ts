// services/apiService.ts
import {
    UserProfile,
    CatImage,
    EnvelopeTypeId,
    AdminUserView,
    PublicPhrase,
    SearchableUser,
    PublicProfileData,
    PublicProfilePhrase,
    TradeOffer,
    FriendData,
    Envelope,
    GameUpgrade,
} from '../types';

// Helper function to handle API requests
const apiRequest = async (url: string, method: string, token: string, body?: any) => {
    const options: RequestInit = {
        method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    const response = await fetch(url, options);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'An API error occurred');
    }
    // Handle cases where the response might be empty (e.g., 204 No Content)
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    }
    return;
};

// --- User Profile & Data ---
export const getUserProfile = (token: string): Promise<UserProfile> => {
    return apiRequest('/api/profile', 'GET', token);
};

export const saveUserData = (token: string, data: Partial<UserProfile['data']>): Promise<void> => {
    return apiRequest('/api/profile', 'POST', token, { data });
};

export const updateProfile = (token: string, data: { username: string; bio: string }): Promise<void> => {
    return apiRequest('/api/profile', 'PUT', token, data);
};


// --- Catalog ---
export const getCatCatalog = (): Promise<CatImage[]> => {
    // Catalog is public and does not require a token
    return apiRequest('/api/community?resource=catalog', 'GET', '');
};

// --- Shop ---
export const getShopData = (): Promise<{ envelopes: Envelope[], upgrades: GameUpgrade[] }> => {
    return apiRequest('/api/shop?resource=data', 'GET', '');
};

export const purchaseEnvelope = (token: string, envelopeId: EnvelopeTypeId): Promise<{ updatedProfile: UserProfile; newImages: CatImage[] }> => {
    return apiRequest('/api/shop', 'POST', token, { action: 'purchaseEnvelope', envelopeId });
};

// --- Community ---
export const getPublicProfile = (token: string, username: string): Promise<PublicProfileData> => {
    return apiRequest(`/api/community?resource=profile&username=${encodeURIComponent(username)}`, 'GET', token);
};

export const searchUsers = (token: string, query: string): Promise<SearchableUser[]> => {
    return apiRequest(`/api/community?resource=search&query=${encodeURIComponent(query)}`, 'GET', token);
};

export const getPublicFeed = (token: string): Promise<PublicProfilePhrase[]> => {
    return apiRequest('/api/community?resource=feed', 'GET', token);
}

export const likePublicPhrase = (token: string, publicPhraseId: string, authorId: string): Promise<{ success: boolean; liked: boolean; updatedProfile: UserProfile }> => {
    return apiRequest('/api/friends', 'POST', token, { action: 'like', publicPhraseId, authorId });
};


// --- Friends & Missions ---
export const getFriends = (token: string): Promise<FriendData> => {
    return apiRequest('/api/friends', 'GET', token);
};

export const addFriend = (token: string, targetUserId: string): Promise<{ success: boolean }> => {
    return apiRequest('/api/friends', 'POST', token, { action: 'add', targetUserId });
};

export const respondToFriendRequest = (token: string, targetUserId: string, response: 'accept' | 'reject'): Promise<{ success: boolean }> => {
    return apiRequest('/api/friends', 'PUT', token, { targetUserId, action: response });
};

export const removeFriend = (token: string, targetUserId: string): Promise<{ success: boolean }> => {
    return apiRequest('/api/friends', 'DELETE', token, { targetUserId });
};

export const startFriendMission = (token: string, friendshipId: string, missionId: string): Promise<{ success: boolean }> => {
    return apiRequest('/api/friends', 'POST', token, { action: 'startMission', friendshipId, missionId });
};

export const claimFriendMissionReward = (token: string, friendshipId: string): Promise<{ success: boolean; newXp: number; newLevel: number }> => {
    return apiRequest('/api/friends', 'POST', token, { action: 'claimReward', friendshipId });
};

// --- Game ---
export const saveGameResults = (token: string, results: { coinsEarned: number; xpEarned: number }): Promise<UserProfile> => {
    return apiRequest('/api/game', 'POST', token, { action: 'saveResults', results });
};

// --- Trading ---
export const getTrades = (token: string): Promise<TradeOffer[]> => {
    return apiRequest('/api/trades', 'GET', token);
};

export const createTrade = (token: string, data: { toUserId: string; offeredImageIds: number[]; requestedImageIds: number[] }): Promise<{ success: boolean }> => {
    return apiRequest('/api/trades', 'POST', token, data);
};

export const respondToTrade = (token: string, tradeId: string, action: 'accept' | 'reject'): Promise<{ success: boolean }> => {
    return apiRequest(`/api/trades`, 'PUT', token, { tradeId, action });
};

export const cancelTrade = (token: string, tradeId: string): Promise<{ success: boolean }> => {
    return apiRequest(`/api/trades`, 'DELETE', token, { tradeId });
};


// --- Admin ---
export const adminGetAllUsers = (token: string): Promise<AdminUserView[]> => {
    return apiRequest('/api/admin?resource=users', 'GET', token);
};

export const adminGetPublicPhrases = (token: string): Promise<PublicPhrase[]> => {
    return apiRequest('/api/admin?resource=phrases', 'GET', token);
};

export const adminSetVerifiedStatus = (token: string, userId: string, isVerified: boolean): Promise<{ success: boolean }> => {
    return apiRequest('/api/admin', 'POST', token, { action: 'setVerified', userId, isVerified });
};

export const adminCensorPhrase = (token: string, publicPhraseId: string): Promise<{ success: boolean }> => {
    return apiRequest('/api/admin', 'POST', token, { action: 'censorPhrase', publicPhraseId });
};

export const adminGetCatCatalog = (token: string): Promise<CatImage[]> => {
    return apiRequest('/api/admin?resource=cats', 'GET', token);
};

export const adminGetEnvelopes = (token: string): Promise<Envelope[]> => {
    return apiRequest('/api/admin?resource=envelopes', 'GET', token);
};

export const adminGetThemes = (token: string): Promise<string[]> => {
    return apiRequest('/api/admin?resource=themes', 'GET', token);
};

export const adminAddCat = (token: string, catData: Omit<CatImage, 'id'>): Promise<{ success: boolean }> => {
    return apiRequest('/api/admin', 'POST', token, { action: 'addCat', ...catData });
};

export const adminEditCat = (token: string, catData: CatImage): Promise<{ success: boolean }> => {
    return apiRequest('/api/admin', 'POST', token, { action: 'editCat', ...catData });
};

export const adminAddEnvelope = (token: string, envelopeData: Omit<Envelope, 'isFeatured'> & {isFeatured: boolean}): Promise<{ success: boolean }> => {
    return apiRequest('/api/admin', 'POST', token, { action: 'addEnvelope', ...envelopeData });
};

export const adminEditEnvelope = (token: string, envelopeData: Envelope): Promise<{ success: boolean }> => {
    return apiRequest('/api/admin', 'POST', token, { action: 'editEnvelope', ...envelopeData });
};

export const adminDeleteEnvelope = (token: string, envelopeId: EnvelopeTypeId): Promise<{ success: boolean }> => {
    return apiRequest('/api/admin', 'POST', token, { action: 'deleteEnvelope', envelopeId });
};

export const adminImportCatCatalog = (token: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest('/api/admin', 'POST', token, { action: 'importCatCatalog' });
};

export const adminGetTrades = (token: string): Promise<TradeOffer[]> => {
    return apiRequest('/api/admin?resource=trades', 'GET', token);
};

export const adminCancelTrade = (token: string, tradeId: string): Promise<{ success: boolean }> => {
    return apiRequest('/api/admin', 'POST', token, { action: 'cancelTrade', tradeId });
};

export const adminGetSettings = (token: string): Promise<any> => {
    return apiRequest('/api/admin?resource=settings', 'GET', token);
};

export const adminSaveSettings = (token: string, settings: any): Promise<{ success: boolean }> => {
    return apiRequest('/api/admin', 'POST', token, { action: 'saveSettings', settings });
};