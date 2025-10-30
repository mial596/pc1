import React from 'react';
import { StoreIcon, SpinnerIcon } from '../hooks/Icons';
import { Envelope, GameUpgrade } from '../types';

interface ShopPageProps {
  shopData: { envelopes: Envelope[], upgrades: GameUpgrade[] } | null;
  onOpenShop: () => void;
}

const FeaturedItem: React.FC<{ envelope: Envelope; onOpenShop: () => void; }> = ({ envelope, onOpenShop }) => (
    <div className="bg-gradient-to-tr from-secondary to-primary p-6 rounded-2xl mb-12 shadow-lg text-white">
        <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="text-8xl flex-shrink-0 animate-pulse">💌</div>
            <div className="text-center md:text-left">
                <p className="font-bold uppercase tracking-wider">¡Sobre Destacado!</p>
                <h2 className="text-3xl font-black text-white">{envelope.name}</h2>
                <p className="mt-1">{envelope.description}</p>
                 <button onClick={onOpenShop} className="btn-themed bg-white text-paper mt-4">
                    ¡Ir a la tienda!
                </button>
            </div>
        </div>
    </div>
);

const ShopPage: React.FC<ShopPageProps> = ({ shopData, onOpenShop }) => {
  const featuredEnvelope = shopData?.envelopes.find(e => e.isFeatured);

  return (
    <div className="container mx-auto p-4 sm:p-6 text-center">
        <div className="max-w-2xl mx-auto">
            {shopData === null ? (
                <div className="flex justify-center items-center h-64">
                    <SpinnerIcon className="w-12 h-12 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    {featuredEnvelope && <FeaturedItem envelope={featuredEnvelope} onOpenShop={onOpenShop} />}
                    <h1 className="text-3xl sm:text-4xl font-black text-ink mb-4">¡Bienvenido a la Tienda!</h1>
                    <p className="text-lg text-ink/80 mb-8">
                        Aquí puedes gastar las monedas que tanto te costó ganar en nuevos sobres de gatos para ampliar tu colección o en mejoras permanentes que te ayudarán en los juegos.
                    </p>
                    <button onClick={onOpenShop} className="btn-themed btn-themed-primary btn-lg flex items-center gap-3 mx-auto text-xl px-8 py-4">
                        <StoreIcon className="w-7 h-7" />
                        Abrir Tienda
                    </button>
                </>
            )}
        </div>
    </div>
  );
};

export default ShopPage;