import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DailyMission, UserProfile } from '../types';
import * as apiService from '../services/apiService';
import { useAuth0 } from '@auth0/auth0-react';
import { CloseIcon, SpinnerIcon } from '../hooks/Icons';

interface MissionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    userProfile: UserProfile;
    onClaimMission: (missionId: string) => void;
}

const MissionsModal: React.FC<MissionsModalProps> = ({ isOpen, onClose, userProfile, onClaimMission }) => {
    const [missions, setMissions] = useState<DailyMission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        if (isOpen) {
            const fetchMissions = async () => {
                setIsLoading(true);
                try {
                    const token = await getAccessTokenSilently();
                    const data = await apiService.getMissions(token);
                    setMissions(data);
                } catch (e) {
                    console.error("Failed to fetch missions", e);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchMissions();
        }
    }, [isOpen, getAccessTokenSilently, userProfile]);

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
                            <h2 className="text-2xl font-black text-ink font-cartoon">Misiones Diarias</h2>
                            <button onClick={onClose} className="text-ink/70 hover:text-ink">
                                <CloseIcon className="w-8 h-8" />
                            </button>
                        </header>

                        <main className="flex-grow overflow-y-auto p-4 sm:p-6 bg-surface-darker min-h-[300px]">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-full"><SpinnerIcon className="w-10 h-10 animate-spin text-primary"/></div>
                            ) : (
                                <div className="space-y-4">
                                    {missions.map(mission => (
                                        <div key={mission.id} className="mission-card-daily">
                                            <div className="flex-grow">
                                                <p className="font-bold">{mission.description}</p>
                                                <div className="flex justify-between items-center text-sm font-bold mt-2">
                                                    <span className="text-primary">{mission.progress} / {mission.goal}</span>
                                                    <span className="text-secondary">🐾 +{mission.rewardPaws}</span>
                                                </div>
                                                <div className="w-full h-3 bg-paper rounded-full overflow-hidden border border-ink/30 mt-1">
                                                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(mission.progress / mission.goal) * 100}%`}}></div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => onClaimMission(mission.id)}
                                                disabled={!mission.isCompleted}
                                                className="btn-themed btn-themed-primary !py-1 !px-4 flex-shrink-0"
                                            >
                                                {mission.isCompleted ? 'OK' : '...'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </main>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MissionsModal;