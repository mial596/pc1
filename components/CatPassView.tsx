import React, { useState, useEffect } from 'react';
import { UserProfile, PassReward, CatImage, Envelope } from '../types';
import * as apiService from '../services/apiService';
import { useAuth0 } from '@auth0/auth0-react';
import { SpinnerIcon, LeafCoinIcon as CoinIcon, LockIcon } from '../hooks/Icons';

interface CatPassViewProps {
    userProfile: UserProfile;
    allImages: CatImage[];
    onPurchasePremium: () => void;
    onClaimReward: (level: number, type: 'free' | 'premium') => void;
}

const FishTokenIcon: React.FC<{className?: string}> = ({className}) => <span className={`font-bold ${className}`}>🐟</span>;

const RewardItem: React.FC<{
    reward: { type: string, value: any },
    isPremium: boolean,
    isClaimed: boolean,
    isUnlocked: boolean,
    level: number,
    track: 'free' | 'premium',
    allImages: CatImage[],
    onClaim: (level: number, type: 'free' | 'premium') => void,
}> = ({ reward, isPremium, isClaimed, isUnlocked, level, track, allImages, onClaim }) => {

    const renderIcon = () => {
        switch(reward.type) {
            case 'coins': return <CoinIcon className="w-8 h-8 text-secondary" />;
            case 'fishTokens': return <FishTokenIcon className="text-4xl" />;
            case 'cat': 
                const cat = allImages.find(c => c.id === reward.value);
                return cat ? <img src={cat.url} className="w-12 h-12 object-cover rounded-md border-2 border-ink" alt="cat"/> : '❓';
            case 'envelope': return <span className="text-4xl">💌</span>;
            default: return '🎁';
        }
    };

    const renderLabel = () => {
         switch(reward.type) {
            case 'coins': return `${reward.value}`;
            case 'fishTokens': return `${reward.value}`;
            case 'cat': 
                const cat = allImages.find(c => c.id === reward.value);
                return cat ? <span className={`text-xs rarity-${cat.rarity}`}>{cat.rarity}</span> : '?';
            case 'envelope': return <span className="text-xs">{reward.value}</span>;
            default: return '';
        }
    }
    
    const canClaim = isUnlocked && !isClaimed && (track === 'free' || isPremium);

    return (
        <div className={`reward-item ${track} ${isClaimed ? 'claimed' : ''} ${isUnlocked ? 'unlocked' : ''} ${!isPremium && track === 'premium' ? 'locked' : ''}`}>
             <div className="reward-icon">{renderIcon()}</div>
             <div className="reward-label">{renderLabel()}</div>
             {canClaim && (
                <button onClick={() => onClaim(level, track)} className="claim-button">
                    OK
                </button>
             )}
             {!isPremium && track === 'premium' && !isUnlocked && (
                <div className="premium-lock"><LockIcon className="w-4 h-4" /></div>
             )}
        </div>
    )
}

const CatPassView: React.FC<CatPassViewProps> = ({ userProfile, allImages, onPurchasePremium, onClaimReward }) => {
    const [rewards, setRewards] = useState<PassReward[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { getAccessTokenSilently } = useAuth0();
    const { catPass } = userProfile.data;
    
    useEffect(() => {
        const fetchRewards = async () => {
            setIsLoading(true);
            try {
                const token = await getAccessTokenSilently();
                const data = await apiService.getCatPassRewards(token);
                setRewards(data);
            } catch(e) {
                console.error("Failed to fetch cat pass rewards", e);
            } finally {
                setIsLoading(false);
            }
        }
        fetchRewards();
    }, [getAccessTokenSilently]);
    
    const progressPercent = (catPass.paws / catPass.pawsToNextLevel) * 100;

    if (isLoading || !rewards) {
        return <div className="flex justify-center p-8"><SpinnerIcon className="w-8 h-8 animate-spin"/></div>
    }

    return (
        <div className="cat-pass-container">
            <header className="cat-pass-header">
                <div className="flex-grow">
                    <h2 className="text-2xl font-black font-cartoon">Pase Gatuno - Temporada {catPass.seasonId}</h2>
                    <div className="flex justify-between font-bold text-sm text-ink mb-1">
                        <span>Nivel {catPass.level}</span>
                        <span>{catPass.paws} / {catPass.pawsToNextLevel} Patitas 🐾</span>
                    </div>
                    <div className="w-full h-4 bg-surface-darker rounded-full overflow-hidden border-2 border-ink/50">
                        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                </div>
                {!catPass.isPremium && (
                    <button onClick={onPurchasePremium} className="btn-themed btn-themed-secondary flex-shrink-0">
                        Comprar Premium
                    </button>
                )}
            </header>

            <div className="cat-pass-track">
                {rewards.map(reward => {
                    const isLevelUnlocked = catPass.level >= reward.level;
                    const isFreeClaimed = catPass.claimedLevels.free.includes(reward.level);
                    const isPremiumClaimed = catPass.claimedLevels.premium.includes(reward.level);

                    return (
                        <div key={reward.level} className="cat-pass-level">
                            <div className="level-marker">{reward.level}</div>
                            {reward.free ? (
                                <RewardItem
                                    reward={reward.free}
                                    isPremium={catPass.isPremium}
                                    isClaimed={isFreeClaimed}
                                    isUnlocked={isLevelUnlocked}
                                    level={reward.level}
                                    track="free"
                                    allImages={allImages}
                                    onClaim={onClaimReward}
                                />
                            ) : <div className="reward-item free empty"></div>}

                            {reward.premium ? (
                                <RewardItem
                                    reward={reward.premium}
                                    isPremium={catPass.isPremium}
                                    isClaimed={isPremiumClaimed}
                                    isUnlocked={isLevelUnlocked}
                                    level={reward.level}
                                    track="premium"
                                    allImages={allImages}
                                    onClaim={onClaimReward}
                                />
                            ) : <div className="reward-item premium empty"></div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CatPassView;