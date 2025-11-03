import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import * as apiService from '../services/apiService';
import { PublicProfilePhrase, Comment } from '../types';
import { SpinnerIcon, HeartIcon, VerifiedIcon, CatSilhouetteIcon } from '../hooks/Icons';

interface CommentSectionProps {
    phraseId: string;
    initialComments: Comment[];
    commentCount: number;
    currentUserId: string;
    onReport: (data: {type: 'comment', contentId: string}) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ phraseId, initialComments, commentCount, currentUserId, onReport }) => {
    const [comments, setComments] = useState(initialComments);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { getAccessTokenSilently } = useAuth0();

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim() === '') return;
        setIsSubmitting(true);
        try {
            const token = await getAccessTokenSilently();
            const addedComment = await apiService.addComment(token, phraseId, newComment);
            setComments(prev => [...prev, addedComment]);
            setNewComment("");
        } catch (err) {
            console.error("Failed to add comment", err);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="comment-section pt-3 mt-3">
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {comments.map(comment => (
                    <div key={comment._id} className="comment">
                        <img src={comment.profilePictureUrl || undefined} alt={comment.username} className="comment-avatar object-cover"/>
                        <div className="comment-content">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-sm">{comment.username}</span>
                                {comment.userId !== currentUserId && 
                                    <button onClick={() => onReport({type: 'comment', contentId: comment._id})} className="font-bold text-xs text-ink/40 hover:text-accent">...</button>
                                }
                            </div>
                            <p className="text-sm">{comment.text}</p>
                        </div>
                    </div>
                ))}
            </div>
            <form onSubmit={handleAddComment} className="comment-form">
                <input 
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Añade un comentario..."
                    className="input-themed !py-2 !text-sm flex-grow"
                />
                <button type="submit" disabled={isSubmitting} className="btn-themed btn-themed-primary !px-4 !py-2">
                    {isSubmitting ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'Ok'}
                </button>
            </form>
        </div>
    );
};


interface PublicFeedProps {
    currentUserId: string;
    onProfileClick: (username: string) => void;
    onReport: (data: {type: 'phrase' | 'comment', contentId: string}) => void;
}

const PublicFeed: React.FC<PublicFeedProps> = ({ currentUserId, onProfileClick, onReport }) => {
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
                            <header className="flex items-center justify-between gap-3 mb-2">
                                <button onClick={() => onProfileClick(phrase.username!)} className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-surface-darker border-2 border-primary flex items-center justify-center">
                                        {phrase.profilePictureUrl ? (
                                            <img src={phrase.profilePictureUrl} alt={phrase.username} className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            <CatSilhouetteIcon className="w-6 h-6 text-ink/70" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                       <span className="font-bold text-base text-ink hover:underline">@{phrase.username}</span>
                                       {phrase.isUserVerified && <VerifiedIcon className="w-4 h-4 text-blue-500" title="Verified User" />}
                                    </div>
                                </button>
                                <button onClick={() => onReport({ type: 'phrase', contentId: phrase.publicPhraseId })} className="font-bold text-xs text-ink/40 hover:text-accent">
                                    ...
                                </button>
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
                            <CommentSection 
                                phraseId={phrase.publicPhraseId}
                                initialComments={phrase.comments}
                                commentCount={phrase.commentCount}
                                currentUserId={currentUserId}
                                onReport={onReport}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-surface rounded-lg">
                    <p className="text-xl font-bold">The feed is quiet...</p>
                    <p className="text-ink/70">Be the first to share a public phrase!</p>
                </div>
            )}
        </div>
    );
};

export default PublicFeed;