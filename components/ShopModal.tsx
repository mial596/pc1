import React from 'react';
import { Envelope, GameUpgrade, PlayerStats, UpgradeId, EnvelopeTypeId } from '../types';
import { CloseIcon, CoinIcon, LockIcon, SpinnerIcon } from '../hooks/Icons';

interface ShopModalProps {
    isOpen: boolean;
    onClose: () => void;
    shopData: { envelopes: Envelope[], upgrades: GameUpgrade[] } | null;
    userCoins: number;
    playerStats: PlayerStats;
    purchasedUpgrades: UpgradeId[];
    onPurchaseEnvelope: (envelopeId: EnvelopeTypeId) => void;
    onPurchaseUpgrade: (upgradeId: UpgradeId) => void;
}

const ShopModal: React.FC<ShopModalProps> = ({
    isOpen,
    onClose,
    shopData,
    userCoins,
    playerStats,
    purchasedUpgrades,
    onPurchaseEnvelope,
    onPurchaseUpgrade,
}) => {
    if (!isOpen) return null;

    const calculateEnvelopeCost = (envelope: Envelope, playerLevel: number): number => {
        return envelope.baseCost + ((playerLevel - 1) * envelope.costIncreasePerLevel);
    };

    return (
        <div className="modal-themed-overlay">
            <div className="modal-themed-content w-full max-w-4xl">
                <header className="flex justify-between items-center p-4 border-b-2 border-ink/20">
                    <h2 className="text-2xl sm:text-3xl font-black text-ink">Tienda de Gatos</h2>
                    <button onClick={onClose} className="text-ink/70 hover:text-ink">
                        <CloseIcon className="w-8 h-8" />
                    </button>
                </header>

                <main className="flex-grow overflow-y-auto p-4 sm:p-6 bg-surface-darker">
                    {!shopData ? (
                        <div className="flex justify-center items-center h-64">
                            <SpinnerIcon className="w-10 h-10 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            {/* Envelopes Section */}
                            <section>
                                <h3 className="text-xl font-bold text-ink mb-4">Sobres de Gatos</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {shopData.envelopes.map((envelope) => {
                                        const cost = calculateEnvelopeCost(envelope, playerStats.level);
                                        const canAfford = userCoins >= cost;
                                        return (
                                            <div key={envelope.id} className="card-themed p-4 flex flex-col items-center text-center">
                                                <div className={`w-24 h-16 rounded-lg flex items-center justify-center text-5xl mb-3 bg-gradient-to-br ${envelope.color}`}>
                                                    💌
                                                </div>
                                                <h4 className="font-bold text-lg">{envelope.name}</h4>
                                                <p className="text-sm text-ink/70 flex-grow">{envelope.description}</p>
                                                <p className="text-xs my-2 text-ink/60">Costo aumenta por nivel</p>
                                                <button
                                                    onClick={() => onPurchaseEnvelope(envelope.id)}
                                                    disabled={!canAfford}
                                                    className="btn-themed btn-themed-primary w-full flex items-center justify-center gap-2 mt-2"
                                                >
                                                    <CoinIcon className="w-5 h-5" /> {cost}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                            
                            {/* Upgrades Section */}
                            <section className="mt-8">
                                <h3 className="text-xl font-bold text-ink mb-4">Mejoras de Juego</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {shopData.upgrades.map((upgrade) => {
                                        const isPurchased = purchasedUpgrades.includes(upgrade.id);
                                        const canAfford = userCoins >= upgrade.cost;
                                        const levelMet = playerStats.level >= upgrade.levelRequired;
                                        const canPurchase = !isPurchased && canAfford && levelMet;

                                        return (
                                            <div key={upgrade.id} className={`p-4 rounded-xl border-2 ${isPurchased ? 'bg-surface-darker border-ink/20' : 'bg-surface border-ink/30'}`}>
                                                <h4 className="font-bold text-lg">{upgrade.name}</h4>
                                                <p className="text-sm text-ink/70 my-1">{upgrade.description}</p>
                                                
                                                {isPurchased ? (
                                                    <p className="font-bold text-center text-green-400 bg-green-900/50 p-2 rounded-md mt-2">Comprado</p>
                                                ) : (
                                                    <>
                                                    {!levelMet && (
                                                        <div className="flex items-center justify-center gap-2 mt-2 text-red-400 font-semibold text-sm bg-red-900/50 p-1 rounded-md">
                                                            <LockIcon className="w-4 h-4"/>
                                                            <span>Requiere Nivel {upgrade.levelRequired}</span>
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={() => onPurchaseUpgrade(upgrade.id)}
                                                        disabled={!canPurchase}
                                                        className="btn-themed btn-themed-secondary w-full flex items-center justify-center gap-2 mt-2"
                                                    >
                                                        <CoinIcon className="w-5 h-5" /> {upgrade.cost}
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
                </main>
            </div>
        </div>
    );
};

export default ShopModal;