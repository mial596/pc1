import React from 'react';
import { StoreIcon } from '../hooks/Icons';

interface ShopPageProps {
  onOpenShop: () => void;
}

const ShopPage: React.FC<ShopPageProps> = ({ onOpenShop }) => {
  return (
    <div className="container mx-auto p-4 sm:p-6 text-center">
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-black text-liver mb-4">¡Bienvenido a la Tienda!</h1>
            <p className="text-lg text-liver/80 mb-8">
                Aquí puedes gastar las monedas que tanto te costó ganar en nuevos sobres de gatos para ampliar tu colección o en mejoras permanentes que te ayudarán en los juegos.
            </p>
            <button onClick={onOpenShop} className="btn-cartoon btn-cartoon-primary btn-lg flex items-center gap-3 mx-auto">
                <StoreIcon className="w-7 h-7" />
                Abrir Tienda
            </button>
        </div>
    </div>
  );
};

export default ShopPage;
