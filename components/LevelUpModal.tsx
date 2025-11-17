import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StarIcon } from '../hooks/Icons';

const Confetti: React.FC = () => (
    <div className="confetti-container">
        {Array.from({ length: 100 }).map((_, i) => (
            <div
                key={i}
                className="confetti-piece"
                style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 5}s`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                    backgroundColor: ['var(--c-primary)', 'var(--c-secondary)', 'var(--c-accent)', '#fff'][Math.floor(Math.random() * 4)],
                }}
            />
        ))}
    </div>
);

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  newLevel: number;
}

const LevelUpModal: React.FC<LevelUpModalProps> = ({ isOpen, onClose, newLevel }) => {
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
                    className="modal-themed-content w-full max-w-md text-center relative overflow-hidden p-6"
                    initial={{ scale: 0.8, y: -100, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
                    exit={{ scale: 0.8, y: 100, opacity: 0 }}
                >
                    <Confetti />
                    <div className="relative z-10 flex flex-col items-center">
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                           <StarIcon className="w-24 h-24 text-secondary drop-shadow-lg" />
                        </motion.div>
                        <h2 className="text-4xl sm:text-5xl font-black text-ink my-4 font-cartoon">¡SUBISTE DE NIVEL!</h2>
                        <p className="text-xl text-ink/80 mb-2">Has alcanzado el</p>
                        <div className="bg-surface-darker border-4 border-primary rounded-full w-32 h-32 flex items-center justify-center mb-6">
                            <span className="font-black text-6xl text-primary font-cartoon">{newLevel}</span>
                        </div>
                        <p className="text-ink/70 mb-6">¡Sigue así para desbloquear más sorpresas!</p>
                        <button
                        onClick={onClose}
                        className="btn-themed btn-themed-primary text-lg"
                        >
                        ¡Genial!
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
  );
};

export default LevelUpModal;