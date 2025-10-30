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

export const purchaseEnvelope = (token: string, envelopeId: EnvelopeTypeId): Promise<{ newCoins: number; newImages: CatImage[] }> => {
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

export const likePublicPhrase = (token: string, publicPhraseId: string): Promise<{ success: boolean; liked: boolean }> => {
    return apiRequest('/api/friends', 'POST', token, { action: 'like', publicPhraseId });
};

// --- Friends ---
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