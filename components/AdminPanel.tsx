import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import * as apiService from '../services/apiService';
import { AdminUserView, PublicPhrase, TradeOffer } from '../types';
import { SpinnerIcon, TrashIcon, CatSilhouetteIcon } from '../hooks/Icons';

import ManageCats from './ManageCats';
import ManageEnvelopes from './ManageEnvelopes';

type Tab = 'users' | 'phrases' | 'cats' | 'envelopes' | 'trades' | 'settings';

const AdminPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('users');

    const renderContent = () => {
        switch(activeTab) {
            case 'users': return <ManageUsers />;
            case 'phrases': return <ManagePhrases />;
            case 'cats': return <ManageCats />;
            case 'envelopes': return <ManageEnvelopes />;
            case 'trades': return <ManageTrades />;
            case 'settings': return <ManageSettings />;
            default: return null;
        }
    };

    const TabButton: React.FC<{ tabId: Tab, children: React.ReactNode }> = ({ tabId, children }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`tab-solid ${activeTab === tabId ? 'tab-solid-active' : 'text-ink/70'}`}
        >
            {children}
        </button>
    );

    return (
        <div className="container mx-auto p-4 sm:p-6">
            <h1 className="text-3xl sm:text-4xl font-black text-ink mb-6 font-spooky">Admin Panel</h1>
            <div className="flex border-b-2 border-ink/20 mb-4 overflow-x-auto">
                <TabButton tabId="users">Users</TabButton>
                <TabButton tabId="phrases">Phrases</TabButton>
                <TabButton tabId="cats">Cats</TabButton>
                <TabButton tabId="envelopes">Envelopes</TabButton>
                <TabButton tabId="trades">Trades</TabButton>
                <TabButton tabId="settings">Settings</TabButton>
            </div>
            {renderContent()}
        </div>
    );
};

// --- Sub-components for managing different sections ---

const ManageUsers: React.FC = () => {
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
            {users.map((user: AdminUserView) => (
                <div key={user.id} className="card-themed p-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-darker border-2 border-primary flex items-center justify-center flex-shrink-0">
                            {user.profilePictureUrl ? (
                                <img src={user.profilePictureUrl} alt={user.username} className="w-full h-full object-cover rounded-full" />
                            ) : (
                                <CatSilhouetteIcon className="w-6 h-6 text-ink/70" />
                            )}
                        </div>
                        <div>
                           <p className="font-bold">{user.username} <span className="text-xs text-ink/50">({user.role})</span></p>
                           <p className="text-xs text-ink/70">{user.id}</p>
                        </div>
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

const ManageTrades: React.FC = () => {
    const [trades, setTrades] = useState<TradeOffer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { getAccessTokenSilently } = useAuth0();

    const fetchTrades = useCallback(async () => {
        setIsLoading(true);
        const token = await getAccessTokenSilently();
        const data = await apiService.adminGetTrades(token);
        setTrades(data);
        setIsLoading(false);
    }, [getAccessTokenSilently]);

    useEffect(() => {
        fetchTrades();
    }, [fetchTrades]);

    const handleCancelTrade = async (tradeId: string) => {
        if (!window.confirm("Are you sure you want to cancel this trade?")) return;
        try {
            const token = await getAccessTokenSilently();
            await apiService.adminCancelTrade(token, tradeId);
            fetchTrades(); // Refresh list
        } catch (err) {
            alert("Failed to cancel trade.");
        }
    };

    const groupedTrades = trades.reduce((acc, trade) => {
        (acc[trade.status] = acc[trade.status] || []).push(trade);
        return acc;
    }, {} as Record<string, TradeOffer[]>);

    if (isLoading) return <div className="flex justify-center p-8"><SpinnerIcon className="w-8 h-8 animate-spin" /></div>;

    return (
        <div>
            {['pending', 'accepted', 'rejected', 'cancelled'].map(status => (
                <div key={status} className="mb-6">
                    <h3 className="text-xl font-bold mb-2 capitalize">{status} Trades</h3>
                    {groupedTrades[status]?.length > 0 ? (
                        <div className="space-y-3">
                            {groupedTrades[status].map(trade => (
                                <div key={trade._id} className="card-themed p-3">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm font-bold">
                                            {trade.fromUsername} ↔️ {trade.toUsername}
                                        </p>
                                        {trade.status === 'pending' && (
                                            <button onClick={() => handleCancelTrade(trade._id)} className="btn-themed btn-themed-danger !py-1 !px-2">Cancel</button>
                                        )}
                                    </div>
                                    {/* Further details can be added here */}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-ink/60">No {status} trades found.</p>
                    )}
                </div>
            ))}
        </div>
    );
};

const ManageSettings: React.FC = () => {
    const [settings, setSettings] = useState({ rarityValues: { common: 0, rare: 0, epic: 0 } });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { getAccessTokenSilently } = useAuth0();

    const fetchSettings = useCallback(async () => {
        setIsLoading(true);
        const token = await getAccessTokenSilently();
        const data = await apiService.adminGetSettings(token);
        if (data) setSettings(data);
        setIsLoading(false);
    }, [getAccessTokenSilently]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const token = await getAccessTokenSilently();
            await apiService.adminSaveSettings(token, settings);
            alert("Settings saved!");
        } catch (err) {
            alert("Failed to save settings.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            rarityValues: { ...prev.rarityValues, [name]: Number(value) }
        }));
    };

    if (isLoading) return <div className="flex justify-center p-8"><SpinnerIcon className="w-8 h-8 animate-spin" /></div>;

    return (
        <div className="card-themed p-4 max-w-lg">
            <h3 className="text-xl font-bold mb-4">Game Economy</h3>
            <div className="space-y-3">
                <div>
                    <label className="font-bold text-sm">Common Value (coins)</label>
                    <input type="number" name="common" value={settings.rarityValues.common} onChange={handleChange} className="input-themed mt-1" />
                </div>
                <div>
                    <label className="font-bold text-sm">Rare Value (coins)</label>
                    <input type="number" name="rare" value={settings.rarityValues.rare} onChange={handleChange} className="input-themed mt-1" />
                </div>
                <div>
                    <label className="font-bold text-sm">Epic Value (coins)</label>
                    <input type="number" name="epic" value={settings.rarityValues.epic} onChange={handleChange} className="input-themed mt-1" />
                </div>
            </div>
            <button onClick={handleSave} disabled={isSaving} className="btn-themed btn-themed-primary mt-4">
                {isSaving ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : "Save Settings"}
            </button>
        </div>
    );
};


export default AdminPanel;