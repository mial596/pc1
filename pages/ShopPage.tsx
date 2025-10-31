import React from 'react';
import { StoreIcon, SpinnerIcon, EnvelopeIcon } from '../hooks/Icons';
import { Envelope, GameUpgrade } from '../types';

interface ShopPageProps {
  shopData: { envelopes: Envelope[], upgrades: GameUpgrade[] } | null;
  onOpenShop: () => void;
}

const FeaturedItem: React.FC<{ envelope: Envelope; onOpenShop: () => void; }> = ({ envelope, onOpenShop }) => (
    <div className="featured-item-card relative overflow-hidden p-6 rounded-2xl mb-12 text-white text-center md:text-left shadow-lg" onClick={onOpenShop}>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="featured-item-icon flex-shrink-0 w-32 h-32 rounded-full flex items-center justify-center">
                <EnvelopeIcon className="w-16 h-16 text-white drop-shadow-lg"/>
            </div>
            <div>
                <p className="font-bold uppercase tracking-wider text-primary">¡Oferta Destacada!</p>
                <h2 className="text-3xl font-black text-white drop-shadow-md font-spooky">{envelope.name}</h2>
                <p className="mt-1 text-ink/90">{envelope.description}</p>
                 <button className="btn-themed btn-themed-primary mt-4 font-bold">
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
        <div className="max-w-3xl mx-auto">
            {shopData === null ? (
                <div className="flex justify-center items-center h-64">
                    <SpinnerIcon className="w-12 h-12 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    {featuredEnvelope && <FeaturedItem envelope={featuredEnvelope} onOpenShop={onOpenShop} />}
                    <h1 className="text-3xl sm:text-4xl font-black text-ink mb-4 font-spooky">¡Bienvenido a la Tienda!</h1>
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