import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import * as apiService from '../services/apiService';
import { PublicProfilePhrase } from '../types';
import { SpinnerIcon, HeartIcon, VerifiedIcon } from '../hooks/Icons';

interface PublicFeedProps {
    currentUserId: string;
    onProfileClick: (username: string) => void;
}

const PublicFeed: React.FC<PublicFeedProps> = ({ currentUserId, onProfileClick }) => {
    const [feed, setFeed] = useState<PublicProfilePhrase[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { getAccessTokenSilently } = useAuth0();

    const fetchFeed = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = await getAccessTokenSilently();
            const data = await apiService.getPublicFeed(token);
            setFeed(data);
        } catch (err) {
            setError('Could not load the community feed.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [getAccessTokenSilently]);

    useEffect(() => {
        fetchFeed();
    }, [fetchFeed]);

    const handleLike = async (publicPhraseId: string) => {
        const originalFeed = [...feed];
        
        const phraseToLike = feed.find(p => p.publicPhraseId === publicPhraseId);
        if (!phraseToLike || !phraseToLike.userId) {
            console.error("Cannot like phrase: author ID is missing.");
            return;
        }

        const updatedFeed = feed.map(p => {
            if (p.publicPhraseId === publicPhraseId) {
                return {
                    ...p,
                    isLikedByMe: !p.isLikedByMe,
                    likeCount: p.isLikedByMe ? p.likeCount - 1 : p.likeCount + 1,
                };
            }
            return p;
        });
        setFeed(updatedFeed);

        try {
            const token = await getAccessTokenSilently();
            // FIX: Pass the phrase's authorId (userId) as the third argument.
            await apiService.likePublicPhrase(token, publicPhraseId, phraseToLike.userId);
        } catch (err) {
            setFeed(originalFeed);
            console.error("Failed to like phrase", err);
        }
    };


    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-10">
                <SpinnerIcon className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return <div className="text-center py-10 text-red-500">{error}</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-black text-ink text-center mb-6 font-spooky">Community Feed</h1>
            {feed.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {feed.map((phrase) => (
                        <div key={phrase.publicPhraseId} className="card-themed p-3">
                            <header className="flex items-center gap-2 mb-2">
                                <button onClick={() => onProfileClick(phrase.username!)} className="font-bold text-base text-ink hover:underline">
                                    @{phrase.username}
                                </button>
                                {phrase.isUserVerified && <VerifiedIcon className="w-4 h-4 text-blue-500" title="Verified User" />}
                            </header>
                            <div className="aspect-square bg-surface-darker rounded-md overflow-hidden border-2 border-ink/20 mb-2">
                                <img src={phrase.imageUrl} alt={phrase.text} className="w-full h-full object-cover"/>
                            </div>
                            <p className="font-bold text-lg mb-2">{phrase.text}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <button
                                    onClick={() => handleLike(phrase.publicPhraseId)}
                                    className="btn-themed !p-2 bg-surface hover:bg-rose-900/50 active:bg-rose-800/50"
                                    aria-label="Like phrase"
                                >
                                    <HeartIcon className={`w-5 h-5 ${phrase.isLikedByMe ? 'text-rose-500' : 'text-ink/50'}`} solid={phrase.isLikedByMe} />
                                </button>
                                <span className="font-black text-base text-ink/90">{phrase.likeCount}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-surface rounded-lg">
                    <p className="font-bold text-xl">The feed is quiet...</p>
                    <p className="text-ink/70">Be the first to share a public phrase!</p>
                </div>
            )}
        </div>
    );
};

export default PublicFeed;