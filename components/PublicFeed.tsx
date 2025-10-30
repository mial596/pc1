import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import * as apiService from '../services/apiService';
import { PublicProfilePhrase } from '../types';
import { SpinnerIcon, HeartIcon, VerifiedIcon } from '../hooks/Icons';

interface PublicFeedProps {
    currentUserId: string;
    onProfileClick: (username: string) => void;
}

const rotations = ['rotate-1', '-rotate-2', 'rotate-2', '-rotate-1'];

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
            await apiService.likePublicPhrase(token, publicPhraseId);
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
        <div className="max-w-2xl mx-auto space-y-12">
            <h1 className="text-3xl font-black text-ink text-center">Community Feed</h1>
            {feed.map((phrase, index) => {
                const rotationClass = rotations[index % rotations.length];
                return (
                    <div key={phrase.publicPhraseId} className={rotationClass}>
                        <div className="card-themed has-tape p-4">
                            <header className="flex items-center gap-3 mb-3">
                                <button onClick={() => onProfileClick(phrase.username!)} className="font-bold text-lg text-ink hover:underline">
                                    @{phrase.username}
                                </button>
                                {phrase.isUserVerified && <VerifiedIcon className="w-5 h-5 text-blue-500" title="Verified User" />}
                            </header>
                            <div className="aspect-square bg-surface-darker rounded-lg overflow-hidden border-2 border-ink/20 mb-3">
                                <img src={phrase.imageUrl} alt={phrase.text} className="w-full h-full object-cover"/>
                            </div>
                            <p className="font-bold text-xl mb-3">{phrase.text}</p>
                            <div className="flex items-center gap-3 mt-2">
                                 <button
                                    onClick={() => handleLike(phrase.publicPhraseId)}
                                    className="btn-themed !p-2 bg-surface hover:bg-rose-900/50 active:bg-rose-800/50"
                                    aria-label="Like phrase"
                                 >
                                    <HeartIcon className={`w-6 h-6 ${phrase.isLikedByMe ? 'text-rose-500' : 'text-ink/50'}`} solid={phrase.isLikedByMe} />
                                 </button>
                                 <span className="font-black text-lg text-ink/90">{phrase.likeCount}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default PublicFeed;