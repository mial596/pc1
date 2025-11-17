import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloseIcon } from '../hooks/Icons';

interface WelcomeTutorialModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TutorialStep: React.FC<{ icon: string, title: string, description: string }> = ({ icon, title, description }) => (
    <div className="flex items-start gap-4">
        <div className="text-5xl flex-shrink-0">{icon}</div>
        <div>
            <h3 className="font-black text-xl text-ink">{title}</h3>
            <p className="text-ink/80">{description}</p>
        </div>
    </div>
);

const WelcomeTutorialModal: React.FC<WelcomeTutorialModalProps> = ({ isOpen, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    className="modal-themed-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div 
                        className="modal-themed-content w-full max-w-lg"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    >
                        <header className="flex justify-between items-center p-4 border-b-2 border-ink/20">
                            <h2 className="text-2xl font-black text-ink font-cartoon">¡Bienvenido a PictoCat!</h2>
                            <button onClick={onClose} className="text-ink/70 hover:text-ink">
                                <CloseIcon className="w-8 h-8" />
                            </button>
                        </header>

                        <main className="flex-grow overflow-y-auto p-6 space-y-6">
                        <p className="text-lg text-center">¡Aquí tienes una guía rápida para empezar!</p>
                        <div className="space-y-5">
                                <TutorialStep 
                                    icon="🎮" 
                                    title="1. Juega en la Sala de Juegos"
                                    description="Participa en divertidos minijuegos para poner a prueba tus habilidades."
                                />
                                <TutorialStep 
                                    icon="💰" 
                                    title="2. Gana Monedas"
                                    description="¡Cuanto mejor juegues, más monedas conseguirás para gastar en la tienda!"
                                />
                                <TutorialStep 
                                    icon="💌" 
                                    title="3. Compra Sobres"
                                    description="Usa tus monedas para abrir sobres sorpresa llenos de nuevos amigos felinos."
                                />
                                <TutorialStep 
                                    icon="🖼️" 
                                    title="4. Colecciona Gatos"
                                    description="Completa tu álbum con gatos de diferentes temas y rarezas."
                                />
                                <TutorialStep 
                                    icon="🏠" 
                                    title="5. Personaliza tu Tablero"
                                    description="Asigna tus gatos favoritos a las frases en tu tablero principal para comunicarte."
                                />
                        </div>
                        </main>
                        
                        <footer className="p-4 bg-surface-darker border-t-2 border-ink/20 flex justify-center">
                            <button onClick={onClose} className="btn-themed btn-themed-primary text-lg">
                                ¡Entendido, a jugar!
                            </button>
                        </footer>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WelcomeTutorialModal;