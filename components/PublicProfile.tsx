import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import * as apiService from '../services/apiService';
import { PublicProfileData, UserProfile } from '../types';
import { SpinnerIcon, VerifiedIcon, ModIcon, AdminIcon, HeartIcon, TradeIcon } from '../hooks/Icons';

interface PublicProfileProps {
    username: string;
    currentUserProfile: UserProfile;
    onStartTrade: (username: string) => void;
}

const PublicProfile: React.FC<PublicProfileProps> = ({ username, currentUserProfile, onStartTrade }) => {
    const [profile, setProfile] = useState<PublicProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { getAccessTokenSilently } = useAuth0();

    const fetchProfile = useCallback(async () => {
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
    }, [username, getAccessTokenSilently]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);
    
    const handleLike = async (publicPhraseId: string) => {
        if (!profile) return;
        
        // Optimistic update
        const updatedPhrases = profile.phrases.map(p => {
            if (p.publicPhraseId === publicPhraseId) {
                return {
                    ...p,
                    isLikedByMe: !p.isLikedByMe,
                    likeCount: p.isLikedByMe ? p.likeCount - 1 : p.likeCount + 1,
                };
            }
            return p;
        });
        setProfile({ ...profile, phrases: updatedPhrases });

        try {
            const token = await getAccessTokenSilently();
            await apiService.likePublicPhrase(token, publicPhraseId);
        } catch (err) {
            // Revert on error by re-fetching
            fetchProfile(); 
            console.error("Failed to like phrase", err);
        }
    };


    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-10">
                <SpinnerIcon className="w-10 h-10 animate-spin text-liver" />
            </div>
        );
    }

    if (error || !profile) {
        return <div className="text-center py-10 text-red-500">{error || 'Profile not found.'}</div>;
    }
    
    const isFriend = currentUserProfile.data.friends.includes(profile.userId);

    const roleIcons = {
        admin: <AdminIcon className="w-5 h-5 text-red-600" title="Admin"/>,
        mod: <ModIcon className="w-5 h-5 text-blue-600" title="Moderator" />,
        user: null
    };

    return (
        <div className="max-w-4xl mx-auto">
            <header className="text-center mb-8">
                <div className="flex justify-center items-center gap-2">
                    <h1 className="text-4xl font-black text-liver">{profile.username}</h1>
                    {profile.isVerified && <VerifiedIcon className="w-7 h-7 text-blue-500" title="Verified"/>}
                    {roleIcons[profile.role]}
                </div>
                <p className="text-liver/80 mt-2 max-w-xl mx-auto">{profile.bio}</p>
                 {isFriend && (
                    <button onClick={() => onStartTrade(profile.username)} className="mt-4 btn-cartoon btn-cartoon-secondary flex items-center gap-2 mx-auto">
                        <TradeIcon className="w-5 h-5"/> Proponer Intercambio
                    </button>
                 )}
            </header>
            
            <h2 className="text-2xl font-bold text-liver mb-4">Frases Públicas</h2>
            {profile.phrases.length > 0 ? (
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {profile.phrases.map(phrase => (
                        <div key={phrase.publicPhraseId} className="card-cartoon p-2 flex flex-col">
                            <div className="aspect-square bg-slate-200 rounded-md overflow-hidden mb-2">
                                <img src={phrase.imageUrl} alt={phrase.text} className="w-full h-full object-cover"/>
                            </div>
                            <p className="font-bold text-center flex-grow mb-2">{phrase.text}</p>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleLike(phrase.publicPhraseId)} className="p-1 rounded-full hover:bg-rose-100">
                                   <HeartIcon className={`w-6 h-6 ${phrase.isLikedByMe ? 'text-rose-500' : 'text-liver/50'}`} solid={phrase.isLikedByMe} />
                                </button>
                                 <span className="font-bold text-sm text-liver/80">{phrase.likeCount}</span>
                            </div>
                        </div>
                    ))}
                 </div>
            ) : (
                <div className="text-center py-12 bg-wheat rounded-lg border-2 border-liver/20">
                    <p className="font-bold text-liver">Este usuario aún no ha compartido ninguna frase.</p>
                </div>
            )}
        </div>
    );
};

export default PublicProfile;