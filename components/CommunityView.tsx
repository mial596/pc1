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
}

const CommunityView: React.FC<CommunityViewProps> = ({ currentUserProfile }) => {
    type View = 'feed' | 'search' | 'profile' | 'trading' | 'friends';
    const [view, setView] = useState<View>('feed');
    const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
    const [profileKey, setProfileKey] = useState(Date.now()); // Used to force re-render of profile

    // This function will be called by child components to trigger a refresh of the user profile
    const refreshUserProfile = useCallback(() => {
        // A real implementation would re-fetch the user profile here.
        // For now, we'll just force a re-render of the component that needs it.
        setProfileKey(Date.now());
    }, []);

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
                            <button onClick={() => setView('search')} className="flex items-center gap-2 font-bold mb-4 text-ink/70 hover:text-ink">
                                <ArrowLeftIcon className="w-5 h-5"/>
                                Volver a la Búsqueda
                            </button>
                            <PublicProfile 
                                key={profileKey} // Force re-mount on user profile data change
                                username={selectedUsername} 
                                currentUserProfile={currentUserProfile} 
                                onStartTrade={handleStartTrade}
                                onFriendAction={refreshUserProfile}
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
                return <FriendsManager currentUserProfile={currentUserProfile} onProfileClick={handleSelectUser} />;

            case 'feed':
            default:
                return <PublicFeed currentUserId={currentUserProfile.id} onProfileClick={handleSelectUser} />;
        }
    };
    
    const TabButton: React.FC<{
        label: string;
        targetView: View;
        currentView: View;
        onClick: (view: View) => void;
        children: React.ReactNode;
    }> = ({ label, targetView, currentView, onClick, children }) => (
         <button onClick={() => onClick(targetView)} className={`px-4 py-2 font-bold flex items-center gap-2 transition-colors ${currentView === targetView ? 'border-b-2 border-primary text-primary' : 'text-ink/60 hover:text-ink'}`}>
            {children} {label}
        </button>
    );

    return (
        <div className="container mx-auto p-4 sm:p-6">
            <div className="flex border-b-2 border-ink/20 mb-6">
                <TabButton label="Feed" targetView="feed" currentView={view} onClick={setView}>
                    <span className="text-xl">📰</span>
                </TabButton>
                <TabButton label="Buscar" targetView="search" currentView={view} onClick={setView}>
                     <span className="text-xl">🔍</span>
                </TabButton>
                 <TabButton label="Amigos" targetView="friends" currentView={view} onClick={setView}>
                    <UsersIcon className="w-5 h-5"/>
                </TabButton>
                <TabButton label="Intercambio" targetView="trading" currentView={view} onClick={setView}>
                    <TradeIcon className="w-5 h-5" />
                </TabButton>
            </div>
            {renderContent()}
        </div>
    );
};

export default CommunityView;