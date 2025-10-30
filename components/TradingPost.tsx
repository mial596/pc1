import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import * as apiService from '../services/apiService';
import { UserProfile, TradeOffer, CatImage, Friend, FriendData, PublicProfileData } from '../types';
import { SpinnerIcon, TradeIcon, VerifiedIcon, ArrowLeftIcon } from '../hooks/Icons';

interface TradingPostProps {
    currentUserProfile: UserProfile;
    preselectedFriendName?: string | null;
    onBack: () => void;
}

const RARITY_CLASSES: Record<string, string> = {
    common: 'border-slate-400',
    rare: 'border-blue-500',
    epic: 'border-purple-600',
};

const TradingPost: React.FC<TradingPostProps> = ({ currentUserProfile, preselectedFriendName, onBack }) => {
    const [activeTab, setActiveTab] = useState<'offers' | 'new'>('offers');
    const [trades, setTrades] = useState<TradeOffer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [friends, setFriends] = useState<Friend[]>([]);

    // New Trade State
    const [tradePartner, setTradePartner] = useState<PublicProfileData | null>(null);
    const [myOffer, setMyOffer] = useState<number[]>([]);
    const [theirRequest, setTheirRequest] = useState<number[]>([]);
    const [myImages, setMyImages] = useState<CatImage[]>([]);

    const { getAccessTokenSilently } = useAuth0();

    const fetchTradesAndFriends = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = await getAccessTokenSilently();
            const [tradeData, friendData] = await Promise.all([
                apiService.getTrades(token),
                apiService.getFriends(token),
            ]);
            setTrades(tradeData);
            setFriends(friendData.friends);

            if (preselectedFriendName) {
                const friend = friendData.friends.find(f => f.username === preselectedFriendName);
                if (friend) {
                    const profileData = await apiService.getPublicProfile(token, friend.username);
                    setTradePartner(profileData);
                }
                setActiveTab('new');
            }
        } catch (error) {
            console.error("Failed to fetch data for trading post", error);
        } finally {
            setIsLoading(false);
        }
    }, [getAccessTokenSilently, preselectedFriendName]);

    useEffect(() => {
        fetchTradesAndFriends();
    }, [fetchTradesAndFriends]);
    
    useEffect(() => {
       const fetchMyImages = async () => {
         const token = await getAccessTokenSilently();
         const myProfile = await apiService.getPublicProfile(token, currentUserProfile.email);
         setMyImages(myProfile.unlockedImages);
       }
       fetchMyImages();
    }, [currentUserProfile.email, getAccessTokenSilently]);

    const handleSelectFriend = async (friendId: string) => {
        const friend = friends.find(f => f.userId === friendId);
        if(!friend) return;
        
        const token = await getAccessTokenSilently();
        const profileData = await apiService.getPublicProfile(token, friend.username);
        setTradePartner(profileData);
        setMyOffer([]);
        setTheirRequest([]);
    }

    const renderOffers = () => {
        const incoming = trades.filter(t => t.toUserId === currentUserProfile.id && t.status === 'pending');
        const outgoing = trades.filter(t => t.fromUserId === currentUserProfile.id && t.status === 'pending');

        return (
            <div>
                <h3 className="text-xl font-bold mb-2">Ofertas Recibidas ({incoming.length})</h3>
                {incoming.length > 0 ? incoming.map(trade => (
                    <div key={trade._id} className="card-cartoon p-3 mb-3">... Vista de la oferta ...</div>
                )) : <p>No tienes ofertas pendientes.</p>}
                
                <h3 className="text-xl font-bold mt-6 mb-2">Ofertas Enviadas ({outgoing.length})</h3>
                 {outgoing.length > 0 ? outgoing.map(trade => (
                    <div key={trade._id} className="card-cartoon p-3 mb-3">... Vista de la oferta ...</div>
                )) : <p>No has enviado ninguna oferta.</p>}
            </div>
        );
    };
    
    const toggleItem = (list: number[], setter: React.Dispatch<React.SetStateAction<number[]>>, id: number) => {
        if (list.includes(id)) {
            setter(list.filter(i => i !== id));
        } else {
            setter([...list, id]);
        }
    }

    const renderNewTrade = () => (
        <div>
            <select onChange={(e) => handleSelectFriend(e.target.value)} value={tradePartner?.userId || ''} className="input-cartoon mb-4">
                <option value="">Selecciona un amigo</option>
                {friends.map(friend => <option key={friend.userId} value={friend.userId}>{friend.username}</option>)}
            </select>
            {tradePartner && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* My Collection */}
                    <div>
                        <h4 className="font-bold text-lg">Tu Oferta</h4>
                        <div className="bg-wheat p-2 rounded-lg h-96 overflow-y-auto grid grid-cols-3 gap-2">
                           {myImages.map(img => (
                               <div key={img.id} onClick={() => toggleItem(myOffer, setMyOffer, img.id)} className={`aspect-square rounded-md overflow-hidden border-4 ${RARITY_CLASSES[img.rarity]} ${myOffer.includes(img.id) ? 'ring-4 ring-offset-2 ring-blue-500' : ''}`}>
                                 <img src={img.url} className="w-full h-full object-cover"/>
                               </div>
                           ))}
                        </div>
                    </div>
                    {/* Their Collection */}
                     <div>
                        <h4 className="font-bold text-lg">Tu Petición</h4>
                         <div className="bg-wheat p-2 rounded-lg h-96 overflow-y-auto grid grid-cols-3 gap-2">
                           {tradePartner.unlockedImages.map(img => (
                               <div key={img.id} onClick={() => toggleItem(theirRequest, setTheirRequest, img.id)} className={`aspect-square rounded-md overflow-hidden border-4 ${RARITY_CLASSES[img.rarity]} ${theirRequest.includes(img.id) ? 'ring-4 ring-offset-2 ring-blue-500' : ''}`}>
                                 <img src={img.url} className="w-full h-full object-cover"/>
                               </div>
                           ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );


    return (
        <div>
            <div className="flex border-b-2 border-liver/20 mb-4">
                <button onClick={() => setActiveTab('offers')} className={`px-4 py-2 font-bold ${activeTab === 'offers' ? 'border-b-4 border-liver' : 'text-liver/60'}`}>Mis Ofertas</button>
                <button onClick={() => setActiveTab('new')} className={`px-4 py-2 font-bold ${activeTab === 'new' ? 'border-b-4 border-liver' : 'text-liver/60'}`}>Nuevo Intercambio</button>
            </div>
             {isLoading ? <SpinnerIcon className="w-8 h-8 animate-spin mx-auto mt-8" /> : (
                activeTab === 'offers' ? renderOffers() : renderNewTrade()
             )}
        </div>
    );
};

export default TradingPost;