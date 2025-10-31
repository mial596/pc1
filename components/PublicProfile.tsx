import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import * as apiService from '../services/apiService';
import { PublicProfileData, UserProfile } from '../types';
import { SpinnerIcon, VerifiedIcon, ModIcon, AdminIcon, HeartIcon, TradeIcon, PlusIcon, UsersIcon } from '../hooks/Icons';

interface PublicProfileProps {
    username: string;
    currentUserProfile: UserProfile;
    onStartTrade: (username: string) => void;
    onFriendAction: () => void; // Callback to refresh parent's friend data
}

const PublicProfile: React.FC<PublicProfileProps> = ({ username, currentUserProfile, onStartTrade, onFriendAction }) => {
    const [profile, setProfile] = useState<PublicProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        const fetchProfile = async () => {
            if (!username) return;
            setIsLoading(true);
            setError(null);
            try {
                const token = await getAccessTokenSilently();
                const data = await apiService.getPublicProfile(token, username);
                setProfile(data);
            } catch (err) {
                setError('Could not load profile. This user may not exist.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [username, getAccessTokenSilently]);
    
    const handleLike = async (publicPhraseId: string) => {
        if (!profile) return;
        const originalPhrases = profile.phrases;
        const updatedPhrases = profile.phrases.map(p => 
            p.publicPhraseId === publicPhraseId ? { ...p, isLikedByMe: !p.isLikedByMe, likeCount: p.isLikedByMe ? p.likeCount - 1 : p.likeCount + 1 } : p
        );
        setProfile({ ...profile, phrases: updatedPhrases });
        try {
            const token = await getAccessTokenSilently();
            await apiService.likePublicPhrase(token, publicPhraseId, profile.userId);
        } catch (err) {
            setProfile({ ...profile, phrases: originalPhrases });
            console.error("Failed to like phrase", err);
        }
    };

    const handleFriendAction = async (action: 'add' | 'remove' | 'accept' | 'reject' | 'cancel') => {
        if (!profile) return;
        setIsActionLoading(true);
        try {
            const token = await getAccessTokenSilently();
            const targetUserId = profile.userId;
            switch(action) {
                case 'add':
                    await apiService.addFriend(token, targetUserId);
                    break;
                case 'remove':
                    await apiService.removeFriend(token, targetUserId);
                    break;
                case 'accept':
                case 'reject':
                    await apiService.respondToFriendRequest(token, targetUserId, action);
                    break;
                case 'cancel':
                    // This is the same as rejecting, but from the sender's side. API should handle it.
                    await apiService.respondToFriendRequest(token, targetUserId, 'reject');
                    break;
            }
            onFriendAction(); // This will trigger a re-fetch in the parent, which updates currentUserProfile
        } catch (err) {
            console.error('Friend action failed:', err);
        } finally {
            setIsActionLoading(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center p-10"><SpinnerIcon className="w-10 h-10 animate-spin text-primary" /></div>;
    }
    if (error || !profile) {
        return <div className="text-center py-10 text-red-500">{error || 'Profile not found.'}</div>;
    }

    const { friendships, friendRequestsSent, friendRequestsReceived } = currentUserProfile.data;
    const isSelf = currentUserProfile.id === profile.userId;
    const isFriend = friendships.some(f => f.userId === profile.userId);
    const isRequestSent = friendRequestsSent.includes(profile.userId);
    const isRequestReceived = friendRequestsReceived.includes(profile.userId);

    const roleIcons = {
        admin: <AdminIcon className="w-5 h-5 text-red-500" title="Admin"/>,
        mod: <ModIcon className="w-5 h-5 text-blue-400" title="Moderator" />,
        user: null
    };

    const renderFriendButton = () => {
        if (isSelf || isActionLoading) return null;
        if (isFriend) {
            return <button onClick={() => handleFriendAction('remove')} className="btn-themed btn-themed-danger">Remove Friend</button>;
        }
        if (isRequestSent) {
            return <button onClick={() => handleFriendAction('cancel')} className="btn-themed bg-gray-500 text-white">Cancel Request</button>;
        }
        if (isRequestReceived) {
            return (
                <div className="flex gap-2">
                    <button onClick={() => handleFriendAction('accept')} className="btn-themed btn-themed-primary">Accept</button>
                    <button onClick={() => handleFriendAction('reject')} className="btn-themed bg-gray-600 text-white">Decline</button>
                </div>
            );
        }
        return <button onClick={() => handleFriendAction('add')} className="btn-themed btn-themed-secondary flex items-center gap-2"><PlusIcon className="w-5 h-5"/> Add Friend</button>;
    };

    return (
        <div className="max-w-4xl mx-auto">
            <header className="text-center mb-8 bg-surface p-6 rounded-lg">
                <div className="flex justify-center items-center gap-2">
                    <h1 className="text-4xl font-black text-ink">{profile.username}</h1>
                    {profile.isVerified && <VerifiedIcon className="w-7 h-7 text-blue-400" title="Verified"/>}
                    {roleIcons[profile.role]}
                </div>
                <p className="text-ink/70 mt-2 max-w-xl mx-auto">{profile.bio}</p>
                <div className="mt-4 flex justify-center items-center gap-4">
                    {renderFriendButton()}
                    {isFriend && (
                        <button onClick={() => onStartTrade(profile.username)} className="btn-themed btn-themed-primary flex items-center gap-2">
                            <TradeIcon className="w-5 h-5"/> Propose Trade
                        </button>
                    )}
                </div>
            </header>
            
            <h2 className="text-2xl font-bold text-ink mb-4">Frases Públicas</h2>
            {profile.phrases.length > 0 ? (
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {profile.phrases.map(phrase => (
                        <div key={phrase.publicPhraseId} className="card-themed p-2 flex flex-col">
                            <div className="aspect-square bg-surface-darker rounded-md overflow-hidden mb-2">
                                <img src={phrase.imageUrl} alt={phrase.text} className="w-full h-full object-cover"/>
                            </div>
                            <p className="font-bold text-center flex-grow mb-2">{phrase.text}</p>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleLike(phrase.publicPhraseId)} className="p-1 rounded-full hover:bg-rose-900/50">
                                   <HeartIcon className={`w-6 h-6 ${phrase.isLikedByMe ? 'text-rose-500' : 'text-ink/50'}`} solid={phrase.isLikedByMe} />
                                </button>
                                 <span className="font-bold text-sm text-ink/80">{phrase.likeCount}</span>
                            </div>
                        </div>
                    ))}
                 </div>
            ) : (
                <div className="text-center py-12 bg-surface rounded-lg border-2 border-ink/20">
                    <p className="font-bold text-ink/80">Este usuario aún no ha compartido ninguna frase.</p>
                </div>
            )}
        </div>
    );
};

export default PublicProfile;