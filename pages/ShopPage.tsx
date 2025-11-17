import React, { useState, useEffect } from 'react';
import { Envelope, GameUpgrade, UpgradeId, EnvelopeTypeId, UserProfile, CatImage, ShopFeaturedItem } from '../types';
import DailyRoulette from '../components/DailyRoulette';
import { SpinnerIcon, LockIcon, LeafCoinIcon as CoinIcon, StarIcon, TimeIcon } from '../hooks/Icons';
import CatPassView from '../components/CatPassView';
import { useLanguage } from '../contexts/LanguageContext';
// Fix: Import TranslationKey to cast dynamic keys for the translation function.
import { TranslationKey } from '../translations';

interface ShopPageProps {
    shopData: { envelopes: Envelope[], upgrades: GameUpgrade[], featured: ShopFeaturedItem[] } | null;
    userProfile: UserProfile;
    allImages: CatImage[];
    onPurchaseEnvelope: (envelopeId: EnvelopeTypeId) => void;
    onPurchaseUpgrade: (upgradeId: UpgradeId) => void;
    onRouletteWin: (coins: number) => void;
    onPurchaseFeaturedCat: (catId: number, cost: number) => void;
    onPurchasePremiumPass: () => void;
    onClaimPassReward: (level: number, type: 'free' | 'premium') => void;
}

const FishTokenIcon: React.FC<{className?: string}> = ({className}) => <span className={`font-bold ${className}`}>🐟</span>;

const CountdownTimer: React.FC<{ expiry: string }> = ({ expiry }) => {
    const { t } = useLanguage();
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            const remaining = new Date(expiry).getTime() - Date.now();
            if (remaining <= 0) {
                setTimeLeft(t('expired'));
                clearInterval(interval);
            } else {
                const hours = Math.floor(remaining / (1000 * 60 * 60));
                const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                setTimeLeft(`${hours}h ${minutes}m`);
            }
        }, 1000 * 60); // Update every minute
        return () => clearInterval(interval);
    }, [expiry, t]);

    return <div className="text-xs font-bold bg-ink/70 text-white px-2 py-1 rounded-full flex items-center gap-1"><TimeIcon className="w-4 h-4"/> {timeLeft}</div>;
};

const ShopPage: React.FC<ShopPageProps> = (props) => {
    const {
        shopData, userProfile, allImages, onPurchaseEnvelope,
        onPurchaseUpgrade, onRouletteWin, onPurchaseFeaturedCat,
        onPurchasePremiumPass, onClaimPassReward,
    } = props;
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'featured' | 'envelopes' | 'pass' | 'roulette'>('featured');
    const { data: userData } = userProfile;

    const calculateEnvelopeCost = (envelope: Envelope, playerLevel: number): number => {
        return envelope.baseCost + ((playerLevel - 1) * envelope.costIncreasePerLevel);
    };
    
    const TabButton: React.FC<{
        label: string;
        target: typeof activeTab;
        icon: React.ReactNode;
    }> = ({ label, target, icon }) => (
        <button
            onClick={() => setActiveTab(target)}
            className={`tab-solid ${activeTab === target ? 'tab-solid-active' : 'text-ink/60'} flex items-center gap-2`}
        >
            {icon} {label}
        </button>
    );

    const renderFeatured = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shopData!.featured.map(item => {
                const cat = allImages.find(c => c.id === item.catId);
                if (!cat) return null;

                const isOwned = userData.unlockedImageIds.includes(cat.id);
                const canAfford = userData.fishTokens >= item.cost;
                
                return (
                    <div key={cat.id} className="card-themed p-4 flex flex-col items-center text-center">
                        <div className="absolute top-2 right-2"><CountdownTimer expiry={item.expiresAt} /></div>
                        <div className="w-full aspect-square rounded-lg overflow-hidden border-4 border-ink/30 mb-2 mt-8">
                           <img src={cat.url} alt={cat.theme} className={`w-full h-full object-cover ${cat.isShiny ? 'shiny-effect' : ''}`} />
                        </div>
                         <h3 className="text-xl font-bold font-display">{cat.theme}</h3>
                         <p className={`text-sm font-bold rarity-${cat.rarity}`}>{t(cat.rarity)} {cat.isShiny && '✨'}</p>
                         
                         {isOwned ? (
                            <button disabled className="btn-themed bg-green-500 text-white w-full mt-2">{t('owned')}</button>
                         ) : (
                            <button
                                onClick={() => onPurchaseFeaturedCat(cat.id, item.cost)}
                                disabled={!canAfford}
                                className="btn-themed btn-themed-secondary w-full flex items-center justify-center gap-2 mt-2"
                            >
                                <FishTokenIcon /> {item.cost}
                            </button>
                         )}
                    </div>
                )
            })}
        </div>
    );

    const renderEnvelopes = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shopData!.envelopes.map((envelope: Envelope) => {
                const originalCost = calculateEnvelopeCost(envelope, userData.playerStats.level);
                const envelopeImagePool = allImages.filter(img =>
                    !envelope.catThemePool || envelope.catThemePool.length === 0 || envelope.catThemePool.includes(img.theme)
                );
                const unlockedIdsInPool = new Set(
                    userData.unlockedImageIds.filter(id => envelopeImagePool.some(img => img.id === id))
                );
                const remainingCount = envelopeImagePool.length - unlockedIdsInPool.size;
                const isCompleted = remainingCount <= 0;
                const imagesToGet = isCompleted ? 0 : Math.min(remainingCount, envelope.imageCount);
                const proratedCost = isCompleted || envelope.imageCount === 0
                    ? originalCost
                    : Math.ceil(originalCost * (imagesToGet / envelope.imageCount));
                const canAfford = userData.coins >= proratedCost;

                return (
                    <div key={envelope.id} className="card-themed shop-envelope-card p-4 flex flex-col items-center text-center">
                        <div className={`relative w-32 h-24 rounded-lg flex items-center justify-center text-7xl mb-3 transition-transform duration-300`}>
                            <div className={`absolute inset-0 rounded-lg ${envelope.color} opacity-50`}></div>
                            <span className="relative z-10 drop-shadow-lg transition-transform duration-300 group-hover:scale-110">💌</span>
                        </div>
                        {/* Fix: Cast envelope.id to TranslationKey for the t function. */}
                        <h3 className="text-2xl font-bold font-display">{t(envelope.id as TranslationKey) || envelope.name}</h3>
                        {/* Fix: Cast template literal to TranslationKey for the t function. */}
                        <p className="text-sm text-ink/70 flex-grow my-2">{t(`${envelope.id}Description` as TranslationKey) || envelope.description}</p>
                        <p className="text-xs my-2 text-ink/60 font-bold bg-surface-darker px-2 py-1 rounded">{t('containsCats', { count: envelope.imageCount })}</p>
                        
                        {isCompleted ? (
                            <button disabled className="btn-themed bg-green-500 text-white w-full mt-2">
                                {t('completed')}
                            </button>
                        ) : (
                            <button
                                onClick={() => onPurchaseEnvelope(envelope.id)}
                                disabled={!canAfford}
                                className="btn-themed btn-themed-primary w-full flex items-center justify-center gap-2 mt-2"
                            >
                                <CoinIcon className="w-6 h-6"/> {proratedCost}
                            </button>
                        )}
                        {!isCompleted && <p className="text-xs mt-2 text-ink/60">{t('remainingToUnlock', { count: remainingCount })}</p>}
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="container mx-auto p-4 sm:p-6">
            <header className="text-center mb-8">
                <h1 className="text-4xl font-black text-ink font-cartoon">{t('shopTitle')}</h1>
                <p className="text-lg text-ink/70 mt-2">{t('shopSubtitle')}</p>
            </header>

            <div className="flex justify-center border-b-2 border-ink mb-8">
                <TabButton label={t('featured')} target="featured" icon={<StarIcon className="w-5 h-5"/>}/>
                <TabButton label={t('envelopes')} target="envelopes" icon="💌"/>
                <TabButton label={t('catPass')} target="pass" icon="🐾"/>
                <TabButton label={t('roulette')} target="roulette" icon="🎡"/>
            </div>

            {!shopData ? (
                <div className="flex justify-center items-center h-64">
                    <SpinnerIcon className="w-12 h-12 animate-spin text-primary" />
                </div>
            ) : (
                <div className="bg-surface-darker p-4 rounded-b-lg rounded-tr-lg border-2 border-ink">
                    {activeTab === 'featured' && renderFeatured()}
                    {activeTab === 'envelopes' && renderEnvelopes()}
                    {activeTab === 'pass' && (
                        <CatPassView 
                            userProfile={userProfile}
                            allImages={allImages}
                            onPurchasePremium={onPurchasePremiumPass}
                            onClaimReward={onClaimPassReward}
                        />
                    )}
                    {activeTab === 'roulette' && <DailyRoulette onWin={onRouletteWin} />}
                </div>
            )}
        </div>
    );
};

export default ShopPage;