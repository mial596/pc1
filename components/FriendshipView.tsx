import React, { useState, useMemo } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Friend } from '../types';
import { ALL_MISSIONS, MissionData } from '../gameData/missions';
import * as apiService from '../services/apiService';
import { SpinnerIcon, UsersIcon, VerifiedIcon, StarIcon, CoinIcon } from '../hooks/Icons';

interface FriendshipViewProps {
    friend: Friend;
    onProfileClick: (username: string) => void;
    onFriendUpdate: () => void;
}

const MAX_FRIENDSHIP_LEVEL = 10;
const XP_PER_LEVEL = 200;

const FriendshipView: React.FC<FriendshipViewProps> = ({ friend, onProfileClick, onFriendUpdate }) => {
    const { getAccessTokenSilently } = useAuth0();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const friendship = friend.friendship;
    const activeMissionData = useMemo(() => {
        if (!friendship?.activeMission) return null;
        return ALL_MISSIONS.find(m => m.id === friendship.activeMission!.missionId) || null;
    }, [friendship]);

    const availableMissions = useMemo(() => {
        return ALL_MISSIONS.filter(m => m.id !== activeMissionData?.id);
    }, [activeMissionData]);
    
    const bonusPercentage = friendship ? Math.min(1 + (friendship.level - 1) * 0.666, 7).toFixed(2) : 0;
    const xpPercentage = friendship ? (friendship.xp / XP_PER_LEVEL) * 100 : 0;

    const handleStartMission = async (missionId: string) => {
        if (!friendship) return;
        setIsSubmitting(true);
        try {
            const token = await getAccessTokenSilently();
            await apiService.startFriendMission(token, friendship._id, missionId);
            onFriendUpdate();
        } catch(e) {
            console.error("Failed to start mission", e);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleClaimReward = async () => {
        if (!friendship) return;
        setIsSubmitting(true);
        try {
            const token = await getAccessTokenSilently();
            await apiService.claimFriendMissionReward(token, friendship._id);
            onFriendUpdate();
        } catch(e) {
            console.error("Failed to claim reward", e);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!friendship) {
        return <div className="text-center p-8">Error: Friendship data not found.</div>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <header className="text-center bg-surface p-6 rounded-lg">
                <div className="flex justify-center items-center gap-2">
                    <h1 className="text-4xl font-black text-ink">{friend.username}</h1>
                    {friend.isVerified && <VerifiedIcon className="w-7 h-7 text-blue-400" title="Verified"/>}
                </div>
                <div className="mt-4 space-y-2">
                    <div className="flex justify-between font-bold text-sm text-primary">
                        <span>Nivel de Amistad: {friendship.level}</span>
                        <span className="text-ink/70">{friendship.xp} / {XP_PER_LEVEL} XP</span>
                    </div>
                    <div className="friendship-xp-bar">
                        <div className="friendship-xp-bar-fill" style={{ width: `${xpPercentage}%` }}></div>
                    </div>
                     <p className="text-sm text-green-400 font-semibold flex items-center justify-center gap-1">
                        <CoinIcon className="w-4 h-4"/> Bono de Monedas: {bonusPercentage}%
                    </p>
                </div>
                <button onClick={() => onProfileClick(friend.username)} className="btn-themed btn-themed-secondary mt-4 !py-1 !px-4">Ver Perfil</button>
            </header>
            
            <section>
                 <h2 className="text-2xl font-bold text-ink mb-3">Misión Activa</h2>
                 {activeMissionData ? (
                     <div className={`mission-card ${friendship.activeMission?.isCompleted ? 'mission-card-completed' : ''}`}>
                         <h3 className="font-bold text-lg">{activeMissionData.title}</h3>
                         <p className="text-ink/70 text-sm my-1">{activeMissionData.description}</p>
                         <div className="mt-3">
                            <div className="flex justify-between text-xs font-bold mb-1">
                                <span>Progreso</span>
                                <span>{friendship.activeMission!.progress} / {activeMissionData.goal}</span>
                            </div>
                            <div className="w-full h-3 bg-surface-darker rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{width: `${(friendship.activeMission!.progress / activeMissionData.goal) * 100}%`}}></div>
                            </div>
                         </div>
                         {friendship.activeMission?.isCompleted && (
                             <button disabled={isSubmitting} onClick={handleClaimReward} className="btn-themed btn-themed-primary w-full mt-4 flex items-center justify-center gap-2">
                               {isSubmitting ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : <><StarIcon className="w-5 h-5"/> Reclamar {activeMissionData.rewardXp} XP</>}
                             </button>
                         )}
                     </div>
                 ) : (
                     <div className="text-center text-ink/70 py-8 bg-surface rounded-lg">
                         <p>No tenéis ninguna misión activa. ¡Empezad una nueva!</p>
                     </div>
                 )}
            </section>
            
            {!friendship.activeMission && (
                <section>
                     <h2 className="text-2xl font-bold text-ink mb-3">Misiones Disponibles</h2>
                     <div className="grid md:grid-cols-2 gap-4">
                        {availableMissions.map(mission => (
                            <div key={mission.id} className="card-themed p-4 flex flex-col">
                                <h3 className="font-bold text-lg text-primary">{mission.title}</h3>
                                <p className="text-sm text-ink/70 flex-grow my-2">{mission.description}</p>
                                <button disabled={isSubmitting} onClick={() => handleStartMission(mission.id)} className="btn-themed btn-themed-secondary w-full mt-2">
                                    Empezar (+{mission.rewardXp} XP)
                                </button>
                            </div>
                        ))}
                     </div>
                </section>
            )}
        </div>
    );
};

export default FriendshipView;