import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Transaction } from '../types';
import * as apiService from '../services/apiService';
import { CloseIcon, SpinnerIcon, CoinIcon } from '../hooks/Icons';

interface TransactionHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({ isOpen, onClose }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { getAccessTokenSilently } = useAuth0();

    const fetchTransactions = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getAccessTokenSilently();
            const data = await apiService.getTransactions(token);
            setTransactions(data);
        } catch (err) {
            setError('Could not load transaction history.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [getAccessTokenSilently]);

    useEffect(() => {
        if (isOpen) {
            fetchTransactions();
        }
    }, [isOpen, fetchTransactions]);

    if (!isOpen) return null;

    return (
        <div className="modal-themed-overlay">
            <div className="modal-themed-content w-full max-w-lg">
                <header className="flex justify-between items-center p-4 border-b-2 border-ink/20">
                    <h2 className="text-2xl font-black text-ink">Historial de Monedas</h2>
                    <button onClick={onClose} className="text-ink/70 hover:text-ink">
                        <CloseIcon className="w-8 h-8" />
                    </button>
                </header>

                <main className="flex-grow overflow-y-auto p-4 sm:p-6 bg-surface-darker min-h-[300px]">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <SpinnerIcon className="w-10 h-10 animate-spin text-primary" />
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-500">{error}</div>
                    ) : transactions.length > 0 ? (
                        <div className="space-y-3">
                            {transactions.map(tx => (
                                <div key={tx._id} className="flex justify-between items-center bg-surface p-3 rounded-lg border-2 border-ink/20">
                                    <div>
                                        <p className="font-bold">{tx.description}</p>
                                        <p className="text-xs text-ink/60">{new Date(tx.date).toLocaleString()}</p>
                                    </div>
                                    <div className={`flex items-center gap-1 font-bold text-lg ${tx.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        <CoinIcon className="w-5 h-5"/>
                                        <span>{tx.amount > 0 ? `+${tx.amount}` : tx.amount}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="text-center text-ink/70 pt-10">
                            <p className="font-bold">No hay transacciones todavía.</p>
                            <p>¡Juega o vende para ganar monedas!</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default TransactionHistoryModal;