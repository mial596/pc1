import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { PublicProfilePhrase, Comment, UserProfile } from '../types';
import * as apiService from '../services/apiService';
import { CloseIcon, SpinnerIcon, CatSilhouetteIcon } from '../hooks/Icons';
import UserBadges from './UserBadges';

interface CommentModalProps {
    isOpen: boolean;
    onClose: () => void;
    phraseData: PublicProfilePhrase | null;
    currentUserProfile: UserProfile;
    onReport: (data: {type: 'comment', contentId: string}) => void;
}

const CommentModal: React.FC<CommentModalProps> = ({ isOpen, onClose, phraseData, currentUserProfile, onReport }) => {
    const [comments, setComments] = useState<Comment[]>(phraseData?.comments || []);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { getAccessTokenSilently } = useAuth0();

    React.useEffect(() => {
        if (phraseData) {
            setComments(phraseData.comments);
        }
    }, [phraseData]);

    if (!isOpen || !phraseData) return null;

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim() === '') return;
        setIsSubmitting(true);
        try {
            const token = await getAccessTokenSilently();
            const addedComment = await apiService.addComment(token, phraseData.publicPhraseId, newComment);
            setComments(prev => [...prev, addedComment]);
            setNewComment("");
        } catch (err) {
            console.error("Failed to add comment", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-themed-overlay">
            <div className="modal-themed-content w-full max-w-lg">
                <header className="flex justify-between items-center p-4 border-b-2 border-ink/20">
                    <h2 className="text-xl font-black text-ink">Comentarios</h2>
                    <button onClick={onClose} className="text-ink/70 hover:text-ink">
                        <CloseIcon className="w-8 h-8" />
                    </button>
                </header>

                <main className="flex-grow overflow-y-auto p-4 space-y-4 bg-surface-darker">
                    {/* Original Post Snippet */}
                    <div className="card-themed p-3 bg-surface">
                         <div className="flex items-center gap-2 mb-2">
                             <div className="w-8 h-8 rounded-full bg-surface-darker border-2 border-primary flex items-center justify-center flex-shrink-0">
                                {phraseData.profilePictureUrl ? (
                                    <img src={phraseData.profilePictureUrl} alt={phraseData.username} className="w-full h-full object-cover rounded-full" />
                                ) : (
                                    <CatSilhouetteIcon className="w-5 h-5 text-ink/70" />
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="font-bold text-sm text-ink">@{phraseData.username}</span>
                                <UserBadges role={phraseData.role!} isVerified={!!phraseData.isUserVerified} />
                            </div>
                         </div>
                        <p className="font-bold">"{phraseData.text}"</p>
                    </div>
                    
                    {/* Comments */}
                    <div className="space-y-3">
                        {comments.map(comment => (
                             <div key={comment._id} className="comment">
                                <img src={comment.profilePictureUrl || undefined} alt={comment.username} className="comment-avatar object-cover"/>
                                <div className="comment-content">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-1">
                                            <span className="font-bold text-sm">{comment.username}</span>
                                            <UserBadges role={comment.role} isVerified={false} />
                                        </div>
                                        {comment.userId !== currentUserProfile.id && 
                                            <button onClick={() => onReport({type: 'comment', contentId: comment._id})} className="font-bold text-xs text-ink/40 hover:text-accent">...</button>
                                        }
                                    </div>
                                    <p className="text-sm">{comment.text}</p>
                                </div>
                            </div>
                        ))}
                         {comments.length === 0 && <p className="text-center text-ink/60 py-4">No hay comentarios todavía.</p>}
                    </div>
                </main>

                <footer className="p-4 bg-surface border-t-2 border-ink/20">
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
                </footer>
            </div>
        </div>
    );
};

export default CommentModal;
