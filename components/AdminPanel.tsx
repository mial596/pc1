import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import * as apiService from '../services/apiService';
import { AdminUserView, PublicPhrase } from '../types';
import { SpinnerIcon, VerifiedIcon, TrashIcon } from '../hooks/Icons';

type Tab = 'users' | 'phrases';

const AdminPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('users');
    const [users, setUsers] = useState<AdminUserView[]>([]);
    const [phrases, setPhrases] = useState<PublicPhrase[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { getAccessTokenSilently } = useAuth0();

    const fetchData = useCallback(async (tab: Tab) => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getAccessTokenSilently();
            if (tab === 'users') {
                const data = await apiService.adminGetAllUsers(token);
                setUsers(data);
            } else {
                const data = await apiService.adminGetPublicPhrases(token);
                setPhrases(data);
            }
        } catch (err) {
            setError('Failed to fetch data.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [getAccessTokenSilently]);

    useEffect(() => {
        fetchData(activeTab);
    }, [activeTab, fetchData]);

    const handleSetVerified = async (userId: string, isVerified: boolean) => {
        try {
            const token = await getAccessTokenSilently();
            await apiService.adminSetVerifiedStatus(token, userId, isVerified);
            setUsers(users.map(u => u.id === userId ? { ...u, isVerified } : u));
        } catch (err) {
            alert('Failed to update verification status.');
        }
    };
    
    const handleCensorPhrase = async (publicPhraseId: string) => {
        if (!window.confirm('Are you sure you want to censor this phrase? This cannot be undone.')) return;
        try {
            const token = await getAccessTokenSilently();
            await apiService.adminCensorPhrase(token, publicPhraseId);
            setPhrases(phrases.filter(p => p.publicPhraseId !== publicPhraseId));
        } catch(err) {
            alert('Failed to censor phrase.');
        }
    };

    const renderContent = () => {
        if (isLoading) return <div className="flex justify-center p-8"><SpinnerIcon className="w-8 h-8 animate-spin" /></div>;
        if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

        if (activeTab === 'users') {
            return (
                <div className="space-y-2">
                    {users.map(user => (
                        <div key={user.id} className="card-cartoon p-3 flex justify-between items-center">
                            <div>
                                <p className="font-bold">{user.email} <span className="text-xs text-liver/50">({user.role})</span></p>
                                <p className="text-xs text-liver/70">{user.id}</p>
                            </div>
                            <button onClick={() => handleSetVerified(user.id, !user.isVerified)} className={`btn-cartoon ${user.isVerified ? 'btn-cartoon-danger' : 'btn-cartoon-primary'}`}>
                                {user.isVerified ? 'Un-verify' : 'Verify'}
                            </button>
                        </div>
                    ))}
                </div>
            );
        }

        if (activeTab === 'phrases') {
            return (
                <div className="space-y-4">
                    {phrases.map(phrase => (
                        <div key={phrase.publicPhraseId} className="card-cartoon p-3 flex justify-between items-center gap-4">
                            <img src={phrase.imageUrl} alt="" className="w-16 h-16 rounded-md object-cover border-2 border-liver" />
                            <div className="flex-grow">
                                <p className="font-bold text-lg">"{phrase.text}"</p>
                                <p className="text-sm text-liver/70">by {phrase.email}</p>
                            </div>
                            <button onClick={() => handleCensorPhrase(phrase.publicPhraseId)} className="btn-cartoon btn-cartoon-danger !p-3">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="container mx-auto p-4 sm:p-6">
            <h1 className="text-3xl sm:text-4xl font-black text-liver mb-6">Admin Panel</h1>
            <div className="flex border-b-2 border-liver/20 mb-4">
                <button onClick={() => setActiveTab('users')} className={`px-4 py-2 font-bold ${activeTab === 'users' ? 'border-b-4 border-liver text-liver' : 'text-liver/60'}`}>Users ({users.length})</button>
                <button onClick={() => setActiveTab('phrases')} className={`px-4 py-2 font-bold ${activeTab === 'phrases' ? 'border-b-4 border-liver text-liver' : 'text-liver/60'}`}>Public Phrases ({phrases.length})</button>
            </div>
            {renderContent()}
        </div>
    );
};

export default AdminPanel;
