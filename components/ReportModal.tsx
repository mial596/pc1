import React, { useState } from 'react';
import { CloseIcon, SpinnerIcon } from '../hooks/Icons';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => Promise<void>;
    itemType: 'phrase' | 'comment';
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, onSubmit, itemType }) => {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (reason.trim().length < 10) {
            alert('Please provide a reason with at least 10 characters.');
            return;
        }
        setIsSubmitting(true);
        await onSubmit(reason);
        setIsSubmitting(false);
        setReason('');
    };

    return (
        <div className="modal-themed-overlay">
            <div className="modal-themed-content w-full max-w-lg">
                <header className="flex justify-between items-center p-4 border-b-2 border-ink/20">
                    <h2 className="text-xl font-black text-ink">Reportar {itemType === 'phrase' ? 'Frase' : 'Comentario'}</h2>
                    <button onClick={onClose} className="text-ink/70 hover:text-ink">
                        <CloseIcon className="w-8 h-8" />
                    </button>
                </header>

                <form onSubmit={handleSubmit}>
                    <main className="p-6 space-y-4">
                        <p className="text-ink/80">Por favor, dinos por qué estás reportando este contenido. Tu reporte es anónimo.</p>
                        <div>
                            <label htmlFor="reportReason" className="font-bold text-sm">Motivo</label>
                            <textarea
                                id="reportReason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={4}
                                maxLength={500}
                                className="input-themed mt-1 text-base"
                                placeholder="Ej: Contenido inapropiado, spam, etc."
                            />
                            <p className="text-right text-xs text-ink/60 mt-1">{reason.length} / 500</p>
                        </div>
                    </main>
                    
                    <footer className="p-4 bg-surface-darker border-t-2 border-ink/20 flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting || reason.trim().length < 10}
                            className="btn-themed btn-themed-danger flex items-center justify-center min-w-[150px]"
                        >
                            {isSubmitting ? <SpinnerIcon className="w-6 h-6 animate-spin"/> : 'Enviar Reporte'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default ReportModal;