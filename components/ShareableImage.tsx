import React from 'react';
import { CloseIcon } from '../hooks/Icons';

interface ShareableImageProps {
    src: string;
    onClose: () => void;
}

const ShareableImage: React.FC<ShareableImageProps> = ({ src, onClose }) => {
    return (
        <div className="modal-themed-overlay">
            <div className="modal-themed-content w-full max-w-md text-center">
                <header className="flex justify-between items-center p-4 border-b-2 border-ink/20">
                    <h2 className="text-xl font-black text-ink">¡Comparte tu botín!</h2>
                    <button onClick={onClose} className="text-ink/70 hover:text-ink">
                        <CloseIcon className="w-8 h-8" />
                    </button>
                </header>
                <main className="p-6 bg-surface-darker">
                    <img src={src} alt="Shareable PictoCat haul" className="w-full h-auto rounded-lg border-2 border-ink/20" />
                </main>
                <footer className="p-4">
                    <a
                        href={src}
                        download="pictocat-haul.png"
                        className="btn-themed btn-themed-primary w-full"
                    >
                        Descargar Imagen
                    </a>
                </footer>
            </div>
        </div>
    );
};

export default ShareableImage;