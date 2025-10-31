import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import * as apiService from '../services/apiService';
import { UserProfile, FriendData, Friend } from '../types';
import { SpinnerIcon, UsersIcon, VerifiedIcon, ArrowLeftIcon, CatSilhouetteIcon } from '../hooks/Icons';
import FriendshipView from './FriendshipView';

interface FriendsManagerProps {
    currentUserProfile: UserProfile;
    onProfileClick: (username: string) => void;
    onProfileUpdate: () => void;
}

const FriendsManager: React.FC<FriendsManagerProps> = ({ currentUserProfile, onProfileClick, onProfileUpdate }) => {
    const [data, setData] = useState<FriendData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
    const { getAccessTokenSilently } = useAuth0();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getAccessTokenSilently();
            const friendData = await apiService.getFriends(token);
            setData(friendData);
        } catch (err) {
            console.error("Failed to fetch friends data", err);
            setError("Could not load your friends list.");
        } finally {
            setIsLoading(false);
        }
    }, [getAccessTokenSilently]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleFriendUpdate = () => {
        fetchData(); // Refreshes the list
        onProfileUpdate(); // Refreshes the main user profile
    }

    const handleRequestResponse = async (targetUserId: string, action: 'accept' | 'reject') => {
        try {
            const token = await getAccessTokenSilently();
            await apiService.respondToFriendRequest(token, targetUserId, action);
            handleFriendUpdate();
        } catch (error) {
            console.error("Failed to respond to friend request", error);
        }
    };

    const handleRemoveFriend = async (targetUserId: string) => {
        if (window.confirm("Are you sure you want to remove this friend?")) {
            try {
                const token = await getAccessTokenSilently();
                await apiService.removeFriend(token, targetUserId);
                handleFriendUpdate();
            } catch (error) {
                console.error("Failed to remove friend", error);
            }
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><SpinnerIcon className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-500">{error}</div>;
    }
    
    if (selectedFriend) {
        return (
            <div>
                 <button onClick={() => setSelectedFriend(null)} className="flex items-center gap-2 font-bold mb-4 text-ink/70 hover:text-ink">
                    <ArrowLeftIcon className="w-5 h-5"/>
                    Volver a la lista de amigos
                </button>
                <FriendshipView
                    friend={selectedFriend}
                    onProfileClick={onProfileClick}
                    onFriendUpdate={handleFriendUpdate}
                />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <section className="mb-8">
                <h2 className="text-2xl font-bold text-ink mb-3">Solicitudes de Amistad ({data?.requests.length || 0})</h2>
                <div className="space-y-3">
                    {data?.requests && data.requests.length > 0 ? (
                        data.requests.map(req => (
                            <div key={req.userId} className="card-themed p-3 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-surface-darker border-2 border-primary flex items-center justify-center">
                                        {req.profilePictureUrl ? (
                                            <img src={req.profilePictureUrl} alt={req.username} className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            <CatSilhouetteIcon className="w-6 h-6 text-ink/70" />
                                        )}
                                    </div>
                                    <span className="font-bold">{req.username}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleRequestResponse(req.userId, 'accept')} className="btn-themed btn-themed-primary !py-1 !px-3">Aceptar</button>
                                    <button onClick={() => handleRequestResponse(req.userId, 'reject')} className="btn-themed bg-gray-600 text-white !py-1 !px-3">Rechazar</button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-ink/60">No tienes solicitudes de amistad pendientes.</p>
                    )}
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-ink mb-3">Tus Amigos ({data?.friends.length || 0})</h2>
                 <div className="space-y-3">
                    {data?.friends && data.friends.length > 0 ? (
                        data.friends.map(friend => (
                            <div key={friend.userId} className="card-themed p-3 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-full bg-surface-darker border-2 border-primary flex items-center justify-center">
                                        {friend.profilePictureUrl ? (
                                            <img src={friend.profilePictureUrl} alt={friend.username} className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            <CatSilhouetteIcon className="w-6 h-6 text-ink/70" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setSelectedFriend(friend)} className="font-bold hover:underline">{friend.username}</button>
                                        {friend.isVerified && <VerifiedIcon className="w-5 h-5 text-blue-400" />}
                                    </div>
                                </div>
                                <button onClick={() => handleRemoveFriend(friend.userId)} className="btn-themed btn-themed-danger !py-1 !px-3">Eliminar</button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-ink/70 bg-surface rounded-lg">
                            <UsersIcon className="w-16 h-16 mx-auto mb-4" />
                            <p className="font-bold">Tu lista de amigos está vacía.</p>
                            <p>¡Usa la pestaña de búsqueda para encontrar y añadir amigos!</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default FriendsManager;