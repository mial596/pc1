import React, { useMemo } from 'react';
import { CatImage } from '../types';
import { CatSilhouetteIcon } from '../hooks/Icons';

interface AlbumProps {
  allImages: CatImage[];
  unlockedImageIds: number[];
}

const Album: React.FC<AlbumProps> = ({ allImages, unlockedImageIds }) => {
  const unlockedSet = useMemo(() => new Set(unlockedImageIds), [unlockedImageIds]);

  const groupedImages = useMemo(() => {
    const groups: { [theme: string]: CatImage[] } = {};
    allImages.forEach(image => {
      if (!groups[image.theme]) {
        groups[image.theme] = [];
      }
      groups[image.theme].push(image);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [allImages]);

  const totalUnlocked = unlockedImageIds.length;
  const totalImages = allImages.length;
  const collectionPercentage = totalImages > 0 ? (totalUnlocked / totalImages) * 100 : 0;

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <header className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-black text-ink font-spooky">Álbum de Gatos</h1>
        <p className="text-lg text-ink/70 mt-2">¡Aquí está tu colección de amigos felinos!</p>
        <div className="max-w-md mx-auto mt-4">
          <div className="flex justify-between font-bold text-sm text-ink mb-1">
            <span>Progreso de Colección</span>
            <span>{totalUnlocked} / {totalImages}</span>
          </div>
          <div className="w-full h-4 bg-surface-darker rounded-full overflow-hidden border-2 border-ink/50">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${collectionPercentage}%` }}
            ></div>
          </div>
        </div>
      </header>
      
      {groupedImages.length > 0 ? (
        <div className="space-y-10">
          {groupedImages.map(([theme, images]) => (
            <section key={theme}>
              <h2 className="text-2xl font-bold text-ink mb-4 border-b-2 border-ink/20 pb-2 capitalize">{theme}</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {images.map(image => {
                  const isUnlocked = unlockedSet.has(image.id);
                  return (
                    <div
                      key={image.id}
                      className={`aspect-square rounded-xl overflow-hidden transition-all duration-300 relative ${isUnlocked ? `bg-paper shadow-lg border-4 border-ink/80 ${image.isShiny ? 'shiny-effect' : ''}` : 'bg-surface'}`}
                    >
                      {isUnlocked ? (
                        <img src={image.url} alt={image.theme} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-2">
                           <CatSilhouetteIcon className="w-full h-full text-ink/30" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-xl font-bold text-ink">El álbum está vacío.</p>
          <p className="text-ink/70">¡Compra sobres en la tienda para empezar tu colección!</p>
        </div>
      )}
    </div>
  );
};

export default Album;