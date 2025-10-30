import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import * as apiService from '../services/apiService';
import { UserProfile, FriendData } from '../types';
import { SpinnerIcon, UsersIcon, VerifiedIcon } from '../hooks/Icons';

interface FriendsManagerProps {
    currentUserProfile: UserProfile;
    onProfileClick: (username: string) => void;
}

const FriendsManager: React.FC<FriendsManagerProps> = ({ currentUserProfile, onProfileClick }) => {
    const [data, setData] = useState<FriendData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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

    const handleRequestResponse = async (targetUserId: string, action: 'accept' | 'reject') => {
        try {
            const token = await getAccessTokenSilently();
            await apiService.respondToFriendRequest(token, targetUserId, action);
            fetchData(); // Refresh data after action
        } catch (error) {
            console.error("Failed to respond to friend request", error);
        }
    };

    const handleRemoveFriend = async (targetUserId: string) => {
        if (window.confirm("Are you sure you want to remove this friend?")) {
            try {
                const token = await getAccessTokenSilently();
                await apiService.removeFriend(token, targetUserId);
                fetchData(); // Refresh data after action
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

    return (
        <div className="max-w-2xl mx-auto">
            <section className="mb-8">
                <h2 className="text-2xl font-bold text-ink mb-3">Friend Requests ({data?.requests.length || 0})</h2>
                <div className="space-y-3">
                    {data?.requests && data.requests.length > 0 ? (
                        data.requests.map(req => (
                            <div key={req.userId} className="card-themed p-3 flex justify-between items-center">
                                <span className="font-bold">{req.username}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => handleRequestResponse(req.userId, 'accept')} className="btn-themed btn-themed-primary !py-1 !px-3">Accept</button>
                                    <button onClick={() => handleRequestResponse(req.userId, 'reject')} className="btn-themed bg-gray-600 text-white !py-1 !px-3">Decline</button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-ink/60">You have no pending friend requests.</p>
                    )}
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-ink mb-3">Your Friends ({data?.friends.length || 0})</h2>
                 <div className="space-y-3">
                    {data?.friends && data.friends.length > 0 ? (
                        data.friends.map(friend => (
                            <div key={friend.userId} className="card-themed p-3 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => onProfileClick(friend.username)} className="font-bold hover:underline">{friend.username}</button>
                                    {friend.isVerified && <VerifiedIcon className="w-5 h-5 text-blue-400" />}
                                </div>
                                <button onClick={() => handleRemoveFriend(friend.userId)} className="btn-themed btn-themed-danger !py-1 !px-3">Remove</button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-ink/70 bg-surface rounded-lg">
                            <UsersIcon className="w-16 h-16 mx-auto mb-4" />
                            <p className="font-bold">Your friends list is empty.</p>
                            <p>Use the search tab to find and add friends!</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default FriendsManager;