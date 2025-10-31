import React from 'react';
import { DailyMission } from '../types';
// FIX: Removed unused import for CheckCircleIcon which is not exported from '../hooks/Icons'.
import { CoinIcon, StarIcon } from '../hooks/Icons';

const MissionIcon: React.FC<{ type: string }> = ({ type }) => {
    const icons: { [key: string]: string } = {
        PLAY_ANY_GAME: '🎮',
        OPEN_ENVELOPE: '💌',
        LIKE_PUBLIC_PHRASE: '❤️',
        CHAT_WITH_PICTO: '💬',
    };
    return <span className="text-3xl">{icons[type] || '🎯'}</span>;
};


interface DailyMissionsProps {
    missions: DailyMission[];
    onClaim: (mission: DailyMission) => void;
}

const DailyMissions: React.FC<DailyMissionsProps> = ({ missions, onClaim }) => {
    
    return (
        <div className="card-themed !border-primary p-4">
            <h2 className="text-2xl font-black text-ink font-spooky text-center mb-4">Misiones Diarias</h2>
            <div className="space-y-4">
                {missions.map(mission => {
                    const isComplete = mission.progress >= mission.goal;
                    const progressPercentage = Math.min((mission.progress / mission.goal) * 100, 100);

                    return (
                        <div key={mission.id} className={`p-3 rounded-lg flex items-center gap-4 transition-colors ${mission.isClaimed ? 'bg-disabled' : 'bg-surface-darker'}`}>
                            <div className="flex-shrink-0 w-12 h-12 bg-surface rounded-full flex items-center justify-center">
                                <MissionIcon type={mission.type} />
                            </div>
                            <div className="flex-grow">
                                <p className="font-bold text-ink">{mission.description}</p>
                                <div className="flex items-center gap-4 mt-1">
                                    <div className="w-full flex-grow daily-mission-progress-bar">
                                        <div className="daily-mission-progress-bar-fill" style={{ width: `${progressPercentage}%` }}></div>
                                    </div>
                                    <span className="text-xs font-bold text-ink/70">{mission.progress}/{mission.goal}</span>
                                </div>
                            </div>
                            <div className="flex-shrink-0 w-28 text-right">
                                {mission.isClaimed ? (
                                    <p className="font-bold text-green-400">¡Reclamado!</p>
                                ) : isComplete ? (
                                    <button onClick={() => onClaim(mission)} className="btn-themed btn-themed-primary !py-1 w-full">Reclamar</button>
                                ) : (
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center gap-1 font-bold text-sm">
                                            <CoinIcon className="w-4 h-4 text-yellow-500" /> {mission.rewardCoins}
                                        </div>
                                         <div className="flex items-center gap-1 font-bold text-sm">
                                            <StarIcon className="w-4 h-4 text-yellow-400" /> {mission.rewardXp}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DailyMissions;