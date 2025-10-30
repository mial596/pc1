import React, { useState } from 'react';
import { UserProfile } from '../types';
import UserSearch from './UserSearch';
import PublicProfile from './PublicProfile';
import PublicFeed from './PublicFeed';
import TradingPost from './TradingPost'; // New component
import { ArrowLeftIcon, TradeIcon } from '../hooks/Icons';

interface CommunityViewProps {
  currentUserProfile: UserProfile;
}

const CommunityView: React.FC<CommunityViewProps> = ({ currentUserProfile }) => {
    const [view, setView] = useState<'feed' | 'search' | 'profile' | 'trading'>('feed');
    const [selectedUsername, setSelectedUsername] = useState<string | null>(null);

    const handleSelectUser = (username: string) => {
        setSelectedUsername(username);
        setView('profile');
    };
    
    const handleStartTrade = (username: string) => {
        setSelectedUsername(username);
        setView('trading');
    }

    const handleBackToSearch = () => {
        setSelectedUsername(null);
        setView('search');
    };
    
    const handleBackToCommunity = () => {
        setSelectedUsername(null);
        setView('feed');
    }

    const renderContent = () => {
        if (view === 'profile' && selectedUsername) {
            return (
                <div>
                    <button onClick={handleBackToSearch} className="flex items-center gap-2 font-bold mb-4 text-liver/80 hover:text-liver">
                        <ArrowLeftIcon className="w-5 h-5"/>
                        Volver a la Búsqueda
                    </button>
                    <PublicProfile username={selectedUsername} currentUserProfile={currentUserProfile} onStartTrade={handleStartTrade}/>
                </div>
            );
        }
        if (view === 'search') {
            return <UserSearch onSelectUser={handleSelectUser} />;
        }
        if (view === 'trading') {
            return <TradingPost currentUserProfile={currentUserProfile} preselectedFriendName={selectedUsername} onBack={handleBackToCommunity}/>
        }
        
        return <PublicFeed currentUserId={currentUserProfile.id} onProfileClick={handleSelectUser} />;
    };
    
    return (
        <div className="container mx-auto p-4 sm:p-6">
            <div className="flex border-b-2 border-liver/20 mb-6">
                <button onClick={() => setView('feed')} className={`px-4 py-2 font-bold ${view === 'feed' ? 'border-b-4 border-liver text-liver' : 'text-liver/60'}`}>
                    Feed
                </button>
                <button onClick={() => setView('search')} className={`px-4 py-2 font-bold ${view === 'search' || view === 'profile' ? 'border-b-4 border-liver text-liver' : 'text-liver/60'}`}>
                    Buscar
                </button>
                <button onClick={() => setView('trading')} className={`px-4 py-2 font-bold flex items-center gap-2 ${view === 'trading' ? 'border-b-4 border-liver text-liver' : 'text-liver/60'}`}>
                    <TradeIcon className="w-5 h-5" /> Intercambio
                </button>
            </div>
            {renderContent()}
        </div>
    );
};

export default CommunityView;