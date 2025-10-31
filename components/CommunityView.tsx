import React, { useState, useCallback } from 'react';
import { UserProfile } from '../types';
import UserSearch from './UserSearch';
import PublicProfile from './PublicProfile';
import PublicFeed from './PublicFeed';
import TradingPost from './TradingPost';
import FriendsManager from './FriendsManager';
import { ArrowLeftIcon, TradeIcon, UsersIcon } from '../hooks/Icons';

interface CommunityViewProps {
  currentUserProfile: UserProfile;
  onProfileUpdate: () => void;
}

const CommunityView: React.FC<CommunityViewProps> = ({ currentUserProfile, onProfileUpdate }) => {
    type View = 'feed' | 'search' | 'profile' | 'trading' | 'friends';
    const [view, setView] = useState<View>('feed');
    const [selectedUsername, setSelectedUsername] = useState<string | null>(null);

    const handleSelectUser = (username: string) => {
        setSelectedUsername(username);
        setView('profile');
    };
    
    const handleStartTrade = (username: string) => {
        setSelectedUsername(username);
        setView('trading');
    }

    const handleBackToCommunity = () => {
        setSelectedUsername(null);
        setView('feed');
    }

    const renderContent = () => {
        switch(view) {
            case 'profile':
                if (selectedUsername) {
                    return (
                        <div>
                            <button onClick={() => { setView('search'); setSelectedUsername(null); }} className="flex items-center gap-2 font-bold mb-4 text-ink/70 hover:text-ink">
                                <ArrowLeftIcon className="w-5 h-5"/>
                                Volver a la Búsqueda
                            </button>
                            <PublicProfile 
                                username={selectedUsername} 
                                currentUserProfile={currentUserProfile} 
                                onStartTrade={handleStartTrade}
                                onFriendAction={onProfileUpdate}
                            />
                        </div>
                    );
                }
                setView('search'); // Fallback if no user is selected
                return null;

            case 'search':
                return <UserSearch onSelectUser={handleSelectUser} />;
            
            case 'trading':
                return <TradingPost currentUserProfile={currentUserProfile} preselectedFriendName={selectedUsername} onBack={handleBackToCommunity}/>
            
            case 'friends':
                return <FriendsManager currentUserProfile={currentUserProfile} onProfileClick={handleSelectUser} onProfileUpdate={onProfileUpdate} />;

            case 'feed':
            default:
                return <PublicFeed currentUserId={currentUserProfile.id} onProfileClick={handleSelectUser} />;
        }
    };
    
    const TabButton: React.FC<{
        label: string;
        targetView: View;
        children: React.ReactNode;
    }> = ({ label, targetView, children }) => (
         <button onClick={() => setView(targetView)} className={`tab-solid ${view === targetView ? 'tab-solid-active' : 'text-ink/70'}`}>
            {children}
            <span className="hidden sm:inline ml-2">{label}</span>
        </button>
    );

    return (
        <div className="container mx-auto p-4 sm:p-6">
            <div className="flex border-b-2 border-ink/20 mb-6">
                <TabButton label="Feed" targetView="feed">
                    <span className="text-xl">📰</span>
                </TabButton>
                <TabButton label="Buscar" targetView="search">
                     <span className="text-xl">🔍</span>
                </TabButton>
                 <TabButton label="Amigos" targetView="friends">
                    <UsersIcon className="w-5 h-5"/>
                </TabButton>
                <TabButton label="Intercambio" targetView="trading">
                    <TradeIcon className="w-5 h-5" />
                </TabButton>
            </div>
            {renderContent()}
        </div>
    );
};

export default CommunityView;