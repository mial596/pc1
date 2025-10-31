import React, { useState, useEffect, useCallback } from 'react';
// FIX: Imports for hooks, services, and types used in sub-components
import { useAuth0 } from '@auth0/auth0-react';
import * as apiService from '../services/apiService';
import { AdminUserView, PublicPhrase } from '../types';
import { SpinnerIcon, TrashIcon } from '../hooks/Icons';

// FIX: Removed imports for ManageUsers and ManagePhrases as they are defined in this file.
import ManageCats from './ManageCats';
import ManageEnvelopes from './ManageEnvelopes';

type Tab = 'users' | 'phrases' | 'cats' | 'envelopes';

const AdminPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('users');

    const renderContent = () => {
        switch(activeTab) {
            case 'users':
                return <ManageUsers />;
            case 'phrases':
                return <ManagePhrases />;
            case 'cats':
                return <ManageCats />;
            case 'envelopes':
                return <ManageEnvelopes />;
            default:
                return null;
        }
    };

    const TabButton: React.FC<{ tabId: Tab, children: React.ReactNode }> = ({ tabId, children }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`px-4 py-2 font-bold transition-colors ${activeTab === tabId ? 'border-b-4 border-primary text-primary' : 'text-ink/60 hover:text-ink'}`}
        >
            {children}
        </button>
    );

    return (
        <div className="container mx-auto p-4 sm:p-6">
            <h1 className="text-3xl sm:text-4xl font-black text-ink mb-6">Admin Panel</h1>
            <div className="flex border-b-2 border-ink/20 mb-4 overflow-x-auto">
                <TabButton tabId="users">Users</TabButton>
                <TabButton tabId="phrases">Phrases</TabButton>
                <TabButton tabId="cats">Cats</TabButton>
                <TabButton tabId="envelopes">Envelopes</TabButton>
            </div>
            {renderContent()}
        </div>
    );
};

// Sub-components for managing different sections
const ManageUsers: React.FC = () => {
    // FIX: Removed require calls and local React destructuring
    
    // FIX: Corrected state typing from `typeof AdminUserView[]` to `AdminUserView[]`
    const [users, setUsers] = useState<AdminUserView[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { getAccessTokenSilently } = useAuth0();

    const fetchUsers = useCallback(async () => {
        const token = await getAccessTokenSilently();
        const data = await apiService.adminGetAllUsers(token);
        setUsers(data);
        setIsLoading(false);
    }, [getAccessTokenSilently]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSetVerified = async (userId: string, isVerified: boolean) => {
        try {
            const token = await getAccessTokenSilently();
            await apiService.adminSetVerifiedStatus(token, userId, isVerified);
            setUsers(users.map(u => u.id === userId ? { ...u, isVerified } : u));
        } catch (err) {
            alert('Failed to update verification status.');
        }
    };

    if (isLoading) return <div className="flex justify-center p-8"><SpinnerIcon className="w-8 h-8 animate-spin" /></div>;
    return (
        <div className="space-y-2">
            {/* FIX: Corrected type for mapped `user` object */}
            {users.map((user: AdminUserView) => (
                <div key={user.id} className="card-themed p-3 flex justify-between items-center">
                    <div>
                        <p className="font-bold">{user.username} <span className="text-xs text-ink/50">({user.role})</span></p>
                        <p className="text-xs text-ink/70">{user.id}</p>
                    </div>
                    <button onClick={() => handleSetVerified(user.id, !user.isVerified)} className={`btn-themed ${user.isVerified ? 'btn-themed-danger' : 'btn-themed-primary'}`}>
                        {user.isVerified ? 'Un-verify' : 'Verify'}
                    </button>
                </div>
            ))}
        </div>
    );
};

const ManagePhrases: React.FC = () => {
    // FIX: Removed require calls and local React destructuring

    // FIX: Corrected state typing from `typeof PublicPhrase[]` to `PublicPhrase[]`
    const [phrases, setPhrases] = useState<PublicPhrase[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { getAccessTokenSilently } = useAuth0();

    const fetchPhrases = useCallback(async () => {
        const token = await getAccessTokenSilently();
        const data = await apiService.adminGetPublicPhrases(token);
        setPhrases(data);
        setIsLoading(false);
    }, [getAccessTokenSilently]);

    useEffect(() => {
        fetchPhrases();
    }, [fetchPhrases]);
    
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

    if (isLoading) return <div className="flex justify-center p-8"><SpinnerIcon className="w-8 h-8 animate-spin" /></div>;
    return (
        <div className="space-y-4">
            {/* FIX: Corrected type for mapped `phrase` object */}
            {phrases.map((phrase: PublicPhrase) => (
                <div key={phrase.publicPhraseId} className="card-themed p-3 flex justify-between items-center gap-4">
                    <img src={phrase.imageUrl} alt="" className="w-16 h-16 rounded-md object-cover border-2 border-ink/20" />
                    <div className="flex-grow">
                        <p className="font-bold text-lg">"{phrase.text}"</p>
                        <p className="text-sm text-ink/70">by {phrase.email}</p>
                    </div>
                    <button onClick={() => handleCensorPhrase(phrase.publicPhraseId)} className="btn-themed btn-themed-danger !p-3">
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default AdminPanel;