import React from 'react';
import { Envelope, GameUpgrade, PlayerStats, UpgradeId, EnvelopeTypeId } from '../types';
import { CloseIcon, CoinIcon, LockIcon } from '../hooks/Icons';
import { calculateEnvelopeCost } from '../shopData';

interface ShopModalProps {
    isOpen: boolean;
    onClose: () => void;
    envelopes: Record<string, Envelope>;
    upgrades: Record<string, GameUpgrade>;
    userCoins: number;
    playerStats: PlayerStats;
    purchasedUpgrades: UpgradeId[];
    onPurchaseEnvelope: (envelopeId: EnvelopeTypeId) => void;
    onPurchaseUpgrade: (upgradeId: UpgradeId) => void;
}

const ShopModal: React.FC<ShopModalProps> = ({
    isOpen,
    onClose,
    envelopes,
    upgrades,
    userCoins,
    playerStats,
    purchasedUpgrades,
    onPurchaseEnvelope,
    onPurchaseUpgrade,
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-cartoon-overlay">
            <div className="modal-cartoon-content w-full max-w-4xl">
                <header className="flex justify-between items-center p-4 border-b-4 border-[var(--c-text)]">
                    <h2 className="text-2xl sm:text-3xl font-black text-[var(--c-text)]">Tienda de Gatos</h2>
                    <button onClick={onClose} className="text-[var(--c-text)]/70 hover:text-[var(--c-text)]">
                        <CloseIcon className="w-8 h-8" />
                    </button>
                </header>

                <main className="flex-grow overflow-y-auto p-4 sm:p-6 bg-[var(--c-surface)]">
                    {/* Envelopes Section */}
                    <section>
                        <h3 className="text-xl font-bold text-[var(--c-text)] mb-4">Sobres de Gatos</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* FIX: Explicitly type 'envelope' as Envelope to fix type inference issue. */}
                            {Object.values(envelopes).map((envelope: Envelope) => {
                                const cost = calculateEnvelopeCost(envelope, playerStats.level);
                                const canAfford = userCoins >= cost;
                                return (
                                    <div key={envelope.id} className="card-cartoon p-4 flex flex-col items-center text-center bg-white">
                                        <div className={`w-24 h-16 rounded-lg flex items-center justify-center text-5xl mb-3 bg-gradient-to-br ${envelope.color}`}>
                                            💌
                                        </div>
                                        <h4 className="font-bold text-lg">{envelope.name}</h4>
                                        <p className="text-sm text-[var(--c-text-muted)] flex-grow">{envelope.description}</p>
                                        <p className="text-xs my-2 text-[var(--c-text)]/60">Costo aumenta por nivel</p>
                                        <button
                                            onClick={() => onPurchaseEnvelope(envelope.id)}
                                            disabled={!canAfford}
                                            className="btn-cartoon btn-cartoon-primary w-full flex items-center justify-center gap-2 mt-2"
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
                         <h3 className="text-xl font-bold text-[var(--c-text)] mb-4">Mejoras de Juego</h3>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* FIX: Explicitly type 'upgrade' as GameUpgrade to fix type inference issue. */}
                            {Object.values(upgrades).map((upgrade: GameUpgrade) => {
                                const isPurchased = purchasedUpgrades.includes(upgrade.id);
                                const canAfford = userCoins >= upgrade.cost;
                                const levelMet = playerStats.level >= upgrade.levelRequired;
                                const canPurchase = !isPurchased && canAfford && levelMet;

                                return (
                                     <div key={upgrade.id} className={`p-4 rounded-xl border-4 ${isPurchased ? 'bg-slate-200 border-slate-300' : 'bg-white border-[var(--c-text)]'}`}>
                                        <h4 className="font-bold text-lg">{upgrade.name}</h4>
                                        <p className="text-sm text-[var(--c-text-muted)] my-1">{upgrade.description}</p>
                                        
                                        {isPurchased ? (
                                            <p className="font-bold text-center text-green-600 bg-green-100 p-2 rounded-md mt-2">Comprado</p>
                                        ) : (
                                            <>
                                            {!levelMet && (
                                                <div className="flex items-center justify-center gap-2 mt-2 text-red-500 font-semibold text-sm bg-red-100 p-1 rounded-md">
                                                    <LockIcon className="w-4 h-4"/>
                                                    <span>Requiere Nivel {upgrade.levelRequired}</span>
                                                </div>
                                            )}
                                             <button
                                                onClick={() => onPurchaseUpgrade(upgrade.id)}
                                                disabled={!canPurchase}
                                                className="btn-cartoon btn-cartoon-secondary w-full flex items-center justify-center gap-2 mt-2"
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
                </main>
            </div>
        </div>
    );
};

export default ShopModal;