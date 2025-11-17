import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloseIcon, SpinnerIcon, LeafCoinIcon } from '../hooks/Icons';

interface RedeemCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRedeem: (code: string) => Promise<{ success: boolean; coinsAdded?: number }>;
}

const RedeemCodeModal: React.FC<RedeemCodeModalProps> = ({ isOpen, onClose, onRedeem }) => {
    const [code, setCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const resetState = () => {
        setCode('');
        setError(null);
        setSuccessMessage(null);
        setIsSubmitting(false);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;
        
        setIsSubmitting(true);
        setError(null);
        setSuccessMessage(null);
        
        try {
            const result = await onRedeem(code.trim().toUpperCase());
            if (result.success) {
                setSuccessMessage(`¡Has canjeado ${result.coinsAdded} monedas!`);
                setCode('');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ha ocurrido un error inesperado.');
        } finally {
            setIsSubmitting(false);
        }
    };

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
                        className="modal-themed-content w-full max-w-md"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    >
                        <header className="flex justify-between items-center p-4 border-b-4 border-ink">
                            <h2 className="text-2xl font-black text-ink font-cartoon">Canjear Código</h2>
                            <button onClick={handleClose} className="text-ink/70 hover:text-ink">
                                <CloseIcon className="w-8 h-8" />
                            </button>
                        </header>

                        <form onSubmit={handleSubmit}>
                            <main className="p-6 space-y-4">
                                <p className="text-ink/80">Introduce un código de regalo para recibir monedas.</p>
                                <div>
                                    <input
                                        id="redeemCode"
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="CÓDIGO-ÚNICO"
                                        className="input-themed mt-1 text-lg uppercase text-center"
                                        disabled={isSubmitting}
                                    />
                                </div>

                                {error && <p className="text-sm text-center text-accent bg-accent/10 p-2 rounded-lg border-2 border-accent/20">{error}</p>}
                                {successMessage && (
                                    <div className="text-center text-green-700 bg-green-500/20 p-3 rounded-lg border-2 border-green-700/30 flex flex-col items-center gap-2">
                                        <LeafCoinIcon className="w-10 h-10"/>
                                        <p className="font-bold text-lg">{successMessage}</p>
                                    </div>
                                )}
                            </main>
                            
                            <footer className="p-4 bg-surface-darker border-t-4 border-ink flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !code.trim() || !!successMessage}
                                    className="btn-themed btn-themed-primary flex items-center justify-center min-w-[150px]"
                                >
                                    {isSubmitting ? <SpinnerIcon className="w-6 h-6 animate-spin"/> : 'Canjear'}
                                </button>
                            </footer>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default RedeemCodeModal;