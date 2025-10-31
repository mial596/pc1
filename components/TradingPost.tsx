import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import * as apiService from '../services/apiService';
import { UserProfile, TradeOffer, CatImage, Friend, PublicProfileData } from '../types';
import { SpinnerIcon, TradeIcon, VerifiedIcon, ArrowLeftIcon, CloseIcon } from '../hooks/Icons';

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

const TradeItem: React.FC<{ image: CatImage, onClick?: () => void, isSelected?: boolean }> = ({ image, onClick, isSelected }) => (
    <div 
        onClick={onClick} 
        className={`aspect-square rounded-lg overflow-hidden border-4 transition-all duration-200 cursor-pointer ${RARITY_CLASSES[image.rarity]} ${isSelected ? 'ring-4 ring-offset-2 ring-primary scale-105' : 'hover:scale-105'}`}
    >
        <img src={image.url} className="w-full h-full object-cover" alt={image.theme} />
    </div>
);

const TradeOfferCard: React.FC<{
    trade: TradeOffer;
    currentUserId: string;
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
    onCancel: (id: string) => void;
}> = ({ trade, currentUserId, onAccept, onReject, onCancel }) => {
    const isIncoming = trade.toUserId === currentUserId;

    return (
        <div className="trade-offer-card bg-surface border-2 border-ink/20 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
                <p className="font-bold text-lg">
                    {isIncoming ? `Oferta de @${trade.fromUsername}` : `Oferta para @${trade.toUsername}`}
                </p>
                <span className="text-xs text-ink/60">{new Date(trade.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <h4 className="font-semibold text-sm text-green-400 mb-2">{isIncoming ? 'Recibes:' : 'Ofreces:'}</h4>
                    <div className="trade-item-grid bg-surface-darker p-2 rounded-md">
                        {trade.offeredImages.map(img => <TradeItem key={img.id} image={img} />)}
                    </div>
                </div>
                 <div>
                    <h4 className="font-semibold text-sm text-red-400 mb-2">{isIncoming ? 'Ofreces:' : 'Pides:'}</h4>
                    <div className="trade-item-grid bg-surface-darker p-2 rounded-md">
                        {trade.requestedImages.map(img => <TradeItem key={img.id} image={img} />)}
                    </div>
                </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
                {isIncoming ? (
                    <>
                        <button onClick={() => onAccept(trade._id)} className="btn-themed btn-themed-primary !py-1 !px-3">Aceptar</button>
                        <button onClick={() => onReject(trade._id)} className="btn-themed bg-gray-600 text-white !py-1 !px-3">Rechazar</button>
                    </>
                ) : (
                    <button onClick={() => onCancel(trade._id)} className="btn-themed btn-themed-danger !py-1 !px-3">Cancelar</button>
                )}
            </div>
        </div>
    );
};


const TradingPost: React.FC<TradingPostProps> = ({ currentUserProfile, preselectedFriendName, onBack }) => {
    const [activeTab, setActiveTab] = useState<'offers' | 'new'>('offers');
    const [trades, setTrades] = useState<TradeOffer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [friends, setFriends] = useState<Friend[]>([]);

    const [tradePartner, setTradePartner] = useState<PublicProfileData | null>(null);
    const [myOffer, setMyOffer] = useState<number[]>([]);
    const [theirRequest, setTheirRequest] = useState<number[]>([]);
    const [myImages, setMyImages] = useState<CatImage[]>([]);
    
    const { getAccessTokenSilently } = useAuth0();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = await getAccessTokenSilently();
            const [tradeData, friendData, myProfileData] = await Promise.all([
                apiService.getTrades(token),
                apiService.getFriends(token),
                apiService.getPublicProfile(token, currentUserProfile.username)
            ]);
            setTrades(tradeData);
            setFriends(friendData.friends);
            setMyImages(myProfileData.unlockedImages);

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
    }, [getAccessTokenSilently, preselectedFriendName, currentUserProfile.username]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSelectFriend = async (friendId: string) => {
        const friend = friends.find(f => f.userId === friendId);
        if(!friend) return;
        
        const token = await getAccessTokenSilently();
        const profileData = await apiService.getPublicProfile(token, friend.username);
        setTradePartner(profileData);
        setMyOffer([]);
        setTheirRequest([]);
    }
    
    const handleTradeResponse = async (tradeId: string, action: 'accept' | 'reject' | 'cancel') => {
        try {
            const token = await getAccessTokenSilently();
            if (action === 'cancel') {
                await apiService.cancelTrade(token, tradeId);
            } else {
                await apiService.respondToTrade(token, tradeId, action);
            }
            fetchData();
        } catch (err) {
            console.error(`Failed to ${action} trade`, err);
        }
    }
    
    const handleSendTrade = async () => {
        if (!tradePartner || myOffer.length === 0 || theirRequest.length === 0) return;
        try {
            const token = await getAccessTokenSilently();
            await apiService.createTrade(token, {
                toUserId: tradePartner.userId,
                offeredImageIds: myOffer,
                requestedImageIds: theirRequest
            });
            setActiveTab('offers');
            setTradePartner(null);
            setMyOffer([]);
            setTheirRequest([]);
            fetchData();
        } catch (err) {
            console.error("Failed to create trade", err);
        }
    }
    
    const toggleItem = (list: number[], setter: React.Dispatch<React.SetStateAction<number[]>>, id: number) => {
        setter(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }
    
    const offeredItems = useMemo(() => myImages.filter(img => myOffer.includes(img.id)), [myOffer, myImages]);
    const requestedItems = useMemo(() => tradePartner?.unlockedImages.filter(img => theirRequest.includes(img.id)) || [], [theirRequest, tradePartner]);

    const renderOffers = () => (
        <div>
            {trades.length === 0 && <p className="text-ink/70 text-center py-8">No tienes ofertas de intercambio activas.</p>}
            {trades.map(trade => (
                <TradeOfferCard
                    key={trade._id}
                    trade={trade}
                    currentUserId={currentUserProfile.id}
                    onAccept={(id) => handleTradeResponse(id, 'accept')}
                    onReject={(id) => handleTradeResponse(id, 'reject')}
                    onCancel={(id) => handleTradeResponse(id, 'cancel')}
                />
            ))}
        </div>
    );
    
    const renderNewTrade = () => (
        <div className="relative">
             <div className="mb-4">
                 <select onChange={(e) => handleSelectFriend(e.target.value)} value={tradePartner?.userId || ''} className="input-themed w-full">
                    <option value="">-- Selecciona un amigo para intercambiar --</option>
                    {friends.map(friend => <option key={friend.userId} value={friend.userId}>{friend.username}</option>)}
                </select>
            </div>
            {tradePartner ? (
                <div className="pb-40"> {/* Padding bottom to avoid overlap with summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-bold text-lg mb-2 text-primary">Tu Colección (Ofreces)</h4>
                            <div className="trade-collection-grid bg-surface-darker p-2 rounded-lg">
                               {myImages.map(img => <TradeItem key={img.id} image={img} onClick={() => toggleItem(myOffer, setMyOffer, img.id)} isSelected={myOffer.includes(img.id)} />)}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-2 text-secondary">Colección de @{tradePartner.username} (Pides)</h4>
                             <div className="trade-collection-grid bg-surface-darker p-2 rounded-lg">
                               {tradePartner.unlockedImages.map(img => <TradeItem key={img.id} image={img} onClick={() => toggleItem(theirRequest, setTheirRequest, img.id)} isSelected={theirRequest.includes(img.id)} />)}
                            </div>
                        </div>
                    </div>

                    <div className="trade-summary-panel fixed bottom-20 left-0 right-0 lg:absolute lg:bottom-0 p-4 bg-surface/95 backdrop-blur-sm border-t-2 border-primary">
                        <div className="container mx-auto grid grid-cols-3 gap-4 items-center">
                            {/* You Give */}
                            <div>
                                <h5 className="font-bold text-sm text-red-400">Tú Ofreces</h5>
                                <div className="trade-summary-grid mt-2">
                                    {offeredItems.slice(0, 4).map(img => <img key={img.id} src={img.url} className="summary-thumb" alt=""/>)}
                                    {offeredItems.length > 4 && <div className="summary-thumb-more">+{offeredItems.length-4}</div>}
                                </div>
                            </div>
                            
                            {/* Action Button */}
                            <div className="text-center">
                                <button onClick={handleSendTrade} disabled={myOffer.length === 0 || theirRequest.length === 0} className="btn-themed btn-themed-primary flex items-center justify-center gap-2 mx-auto">
                                    <TradeIcon className="w-5 h-5" /> Enviar Oferta
                                </button>
                            </div>

                            {/* You Get */}
                             <div>
                                <h5 className="font-bold text-sm text-green-400 text-right">Tú Pides</h5>
                                <div className="trade-summary-grid mt-2 justify-end">
                                    {requestedItems.slice(0, 4).map(img => <img key={img.id} src={img.url} className="summary-thumb" alt=""/>)}
                                    {requestedItems.length > 4 && <div className="summary-thumb-more">+{requestedItems.length-4}</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 text-ink/70">
                    <p>Selecciona un amigo para empezar a intercambiar.</p>
                </div>
            )}
        </div>
    );


    return (
        <div>
            {preselectedFriendName && activeTab === 'new' && (
                 <button onClick={onBack} className="flex items-center gap-2 font-bold mb-4 text-ink/70 hover:text-ink">
                    <ArrowLeftIcon className="w-5 h-5"/>
                    Volver al perfil de @{preselectedFriendName}
                </button>
            )}
            <div className="flex border-b-2 border-ink/20 mb-4">
                <button onClick={() => setActiveTab('offers')} className={`px-4 py-2 font-bold ${activeTab === 'offers' ? 'border-b-4 border-primary text-primary' : 'text-ink/60'}`}>Mis Ofertas</button>
                <button onClick={() => setActiveTab('new')} className={`px-4 py-2 font-bold ${activeTab === 'new' ? 'border-b-4 border-primary text-primary' : 'text-ink/60'}`}>Nuevo Intercambio</button>
            </div>
             {isLoading ? <div className="flex justify-center p-8"><SpinnerIcon className="w-8 h-8 animate-spin mx-auto mt-8" /></div> : (
                activeTab === 'offers' ? renderOffers() : renderNewTrade()
             )}
        </div>
    );
};

export default TradingPost;