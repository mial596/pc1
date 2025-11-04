import React from 'react';
import { Envelope, GameUpgrade, UpgradeId, EnvelopeTypeId, UserProfile, CatImage } from '../types';
import { SpinnerIcon, LockIcon, CoinIcon } from '../hooks/Icons';

interface ShopPageProps {
    shopData: { envelopes: Envelope[], upgrades: GameUpgrade[] } | null;
    userProfile: UserProfile;
    allImages: CatImage[];
    onPurchaseEnvelope: (envelopeId: EnvelopeTypeId) => void;
    onPurchaseUpgrade: (upgradeId: UpgradeId) => void;
}

const ShopPage: React.FC<ShopPageProps> = ({
    shopData,
    userProfile,
    allImages,
    onPurchaseEnvelope,
    onPurchaseUpgrade,
}) => {
    const { data: userData } = userProfile;

    const calculateEnvelopeCost = (envelope: Envelope, playerLevel: number): number => {
        return envelope.baseCost + ((playerLevel - 1) * envelope.costIncreasePerLevel);
    };

    return (
        <div className="container mx-auto p-4 sm:p-6">
            <header className="text-center mb-8">
                <h1 className="text-4xl font-black text-ink font-cartoon">Tienda de Gatos</h1>
                <p className="text-lg text-ink/70 mt-2">¡Gasta tus monedas en nuevos gatos y mejoras!</p>
            </header>

            {!shopData ? (
                <div className="flex justify-center items-center h-64">
                    <SpinnerIcon className="w-12 h-12 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    {/* Envelopes Section */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-bold text-ink mb-6 font-cartoon">Sobres de Gatos</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {shopData.envelopes.map((envelope: Envelope) => {
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
                                    <div key={envelope.id} className="card-themed p-4 flex flex-col items-center text-center">
                                        <div className={`w-32 h-24 rounded-lg flex items-center justify-center text-7xl mb-3 bg-gradient-to-br ${envelope.color} transition-transform hover:scale-105`}>
                                            💌
                                        </div>
                                        <h3 className="text-2xl font-bold font-cartoon">{envelope.name}</h3>
                                        <p className="text-sm text-ink/70 flex-grow my-2">{envelope.description}</p>
                                        <p className="text-xs my-2 text-ink/60 font-bold">Contiene {envelope.imageCount} gatos</p>
                                        
                                        {isCompleted ? (
                                            <button disabled className="btn-themed btn-themed-secondary w-full mt-2">
                                                ¡Completado!
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
                                        {!isCompleted && <p className="text-xs mt-2 text-ink/60">Quedan {remainingCount} por desbloquear</p>}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                    
                    {/* Upgrades Section */}
                    <section>
                        <h2 className="text-3xl font-bold text-ink mb-6 font-cartoon">Mejoras de Juego</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {shopData.upgrades.map((upgrade: GameUpgrade) => {
                                const isPurchased = userData.purchasedUpgrades.includes(upgrade.id);
                                const canAfford = userData.coins >= upgrade.cost;
                                const levelMet = userData.playerStats.level >= upgrade.levelRequired;
                                const canPurchase = !isPurchased && canAfford && levelMet;

                                return (
                                    <div key={upgrade.id} className={`p-4 rounded-xl border-4 ${isPurchased ? 'bg-surface-darker border-ink/20 opacity-70' : 'bg-surface border-ink/30'}`}>
                                        <h3 className="text-xl font-bold font-cartoon">{upgrade.name}</h3>
                                        <p className="text-sm text-ink/70 my-2">{upgrade.description}</p>
                                        
                                        {isPurchased ? (
                                            <p className="font-bold text-center text-green-500 bg-green-900/50 p-2 rounded-md mt-2">Comprado</p>
                                        ) : (
                                            <>
                                            {!levelMet && (
                                                <div className="flex items-center justify-center gap-2 mt-2 text-red-500 font-semibold text-sm bg-red-900/50 p-1 rounded-md">
                                                    <LockIcon className="w-4 h-4" />
                                                    <span>Requiere Nivel {upgrade.levelRequired}</span>
                                                </div>
                                            )}
                                            <button
                                                onClick={() => onPurchaseUpgrade(upgrade.id)}
                                                disabled={!canPurchase}
                                                className="btn-themed btn-themed-secondary w-full flex items-center justify-center gap-2 mt-2"
                                            >
                                                <CoinIcon className="w-6 h-6" /> {upgrade.cost}
                                            </button>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </>
            )}
        </div>
    );
};

export default ShopPage;