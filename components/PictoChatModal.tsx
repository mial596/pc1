import React, { useState, useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import * as apiService from '../services/apiService';
import { ChatMessage } from '../types';
import { CloseIcon, SpinnerIcon, CatSilhouetteIcon } from '../hooks/Icons';

interface PictoChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    onFirstChat: () => void;
}

const PictoChatModal: React.FC<PictoChatModalProps> = ({ isOpen, onClose, onFirstChat }) => {
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasChatted, setHasChatted] = useState(false);
    const { getAccessTokenSilently } = useAuth0();
    const chatBodyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setHistory([]);
            setInput('');
            setIsLoading(false);
            setHasChatted(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [history, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const newUserMessage: ChatMessage = { role: 'user', text: input };
        const newHistory = [...history, newUserMessage];
        setHistory(newHistory);
        setInput('');
        setIsLoading(true);

        if (!hasChatted) {
            onFirstChat();
            setHasChatted(true);
        }

        try {
            const token = await getAccessTokenSilently();
            const response = await apiService.chatWithPicto(token, newHistory);
            const modelMessage: ChatMessage = { role: 'model', text: response.reply };
            setHistory(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error("Error chatting with Picto:", error);
            const errorMessage: ChatMessage = { role: 'model', text: "Miau... lo siento, mis circuitos se enredaron. Inténtalo de nuevo." };
            setHistory(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="modal-themed-overlay">
            <div className="modal-themed-content w-full max-w-2xl">
                <header className="flex justify-between items-center p-4 border-b-2 border-primary">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                           <CatSilhouetteIcon className="w-8 h-8 text-white"/>
                        </div>
                        <h2 className="text-2xl font-black text-ink font-spooky">Habla con Picto</h2>
                    </div>
                    <button onClick={onClose} className="text-ink/70 hover:text-ink">
                        <CloseIcon className="w-8 h-8" />
                    </button>
                </header>

                <main ref={chatBodyRef} className="flex-grow overflow-y-auto p-4 space-y-4 bg-surface-darker">
                    {history.length === 0 && (
                        <div className="text-center p-8 text-ink/70">
                            <p className="font-bold">¡Hola! Soy Picto.</p>
                            <p>Puedes preguntarme sobre el juego, pedirme un chiste de gatos, ¡o lo que quieras!</p>
                        </div>
                    )}
                    {history.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 px-4 ${msg.role === 'user' ? 'picto-chat-message-user' : 'picto-chat-message-model'}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex justify-start">
                            <div className="max-w-[80%] p-3 px-4 picto-chat-message-model flex items-center gap-2">
                                <SpinnerIcon className="w-5 h-5 animate-spin" />
                                <span>Picto está pensando...</span>
                            </div>
                        </div>
                    )}
                </main>

                <footer className="p-4 bg-surface border-t-2 border-ink/20">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Escribe un mensaje..."
                            className="input-themed flex-grow"
                            disabled={isLoading}
                        />
                        <button onClick={handleSend} disabled={isLoading || !input.trim()} className="btn-themed btn-themed-primary !p-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default PictoChatModal;
