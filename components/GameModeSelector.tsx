import React, { useState } from 'react';
import { GameMode, CatImage, UpgradeId, CatMemoryMode, CatTriviaMode } from '../types';
import { GAMES_DATA, GAME_MODES } from '../gameData';
import { ArrowLeftIcon, LockIcon, CatSilhouetteIcon, BrainIcon, QuestionMarkIcon, MusicNoteIcon } from '../hooks/Icons';
import MouseHuntGame from './MouseHuntGame';
import CatMemoryGame from './CatMemoryGame';
import SimonSaysGame from './SimonSaysGame';
import CatTriviaGame from './CatTriviaGame';
import FelineRhythmGame from './FelineRhythmGame';

interface GameModeSelectorProps {
    unlockedImages: CatImage[];
    upgrades: UpgradeId[];
    onGameEnd: (results: { score: number; coinsEarned: number; xpEarned: number }) => void;
}

const gameIcons: { [key: string]: React.ReactNode } = {
    mouseHunt: <span className="text-6xl">🐭</span>,
    catMemory: <BrainIcon className="w-16 h-16"/>,
    simonSays: <CatSilhouetteIcon className="w-16 h-16"/>,
    catTrivia: <QuestionMarkIcon className="w-16 h-16"/>,
    felineRhythm: <MusicNoteIcon className="w-16 h-16"/>,
};

const GameModeSelector: React.FC<GameModeSelectorProps> = ({ unlockedImages, upgrades, onGameEnd }) => {
    const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
    const [activeGameMode, setActiveGameMode] = useState<GameMode | null>(null);
    
    const handleGameEnd = (results: { score: number; coinsEarned: number; xpEarned: number }) => {
        setActiveGameMode(null);
        onGameEnd(results);
    };

    if (activeGameMode) {
        switch (activeGameMode.gameId) {
            case 'mouseHunt':
                return <MouseHuntGame mode={activeGameMode} upgrades={{ betterBait: upgrades.includes('betterBait'), extraTime: upgrades.includes('extraTime') }} onGameEnd={handleGameEnd} />;
            case 'catMemory':
                return <CatMemoryGame mode={activeGameMode} images={unlockedImages} onGameEnd={handleGameEnd} />;
            case 'simonSays':
                return <SimonSaysGame mode={activeGameMode} onGameEnd={handleGameEnd} />;
            case 'catTrivia':
                return <CatTriviaGame mode={activeGameMode} images={unlockedImages} onGameEnd={handleGameEnd} />;
            case 'felineRhythm':
                return <FelineRhythmGame mode={activeGameMode} onGameEnd={handleGameEnd} />;
            default:
                setActiveGameMode(null);
                return null;
        }
    }

    const renderContent = () => {
        if (selectedGameId) {
            const game = GAMES_DATA[selectedGameId];
            const modes = GAME_MODES.filter(m => m.gameId === selectedGameId);

            return (
                <div>
                    <button onClick={() => setSelectedGameId(null)} className="flex items-center gap-2 font-bold mb-4 text-ink/70 hover:text-primary">
                        <ArrowLeftIcon className="w-5 h-5"/>
                        Volver a Juegos
                    </button>
                    <h2 className="text-3xl font-black text-ink mb-2 font-spooky">{game.name}</h2>
                    <p className="text-ink/70 mb-6">{game.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {modes.map(mode => {
                            let isLocked = false;
                            let lockReason = '';
                            if (mode.gameId === 'catMemory' || mode.gameId === 'catTrivia') {
                                const requiredImages = (mode as CatMemoryMode | CatTriviaMode).minImagesRequired;
                                if (unlockedImages.length < requiredImages) {
                                    isLocked = true;
                                    lockReason = `Necesitas ${requiredImages} gatos`;
                                }
                            }

                            return (
                                <div key={mode.id} className={`card-themed p-4 flex flex-col ${isLocked ? 'bg-disabled' : ''}`}>
                                    <h3 className="font-bold text-xl text-primary">{mode.name}</h3>
                                    <p className="text-sm text-ink/70 flex-grow my-2">{mode.description}</p>
                                    {isLocked ? (
                                        <div className="flex items-center justify-center gap-2 mt-2 text-accent font-semibold text-sm bg-accent/20 p-2 rounded-md">
                                            <LockIcon className="w-4 h-4"/>
                                            <span>{lockReason}</span>
                                        </div>
                                    ) : (
                                        <button onClick={() => setActiveGameMode(mode)} className="btn-themed btn-themed-primary w-full mt-2">
                                            Jugar
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        return (
            <div>
                 <h1 className="text-3xl sm:text-4xl font-black text-ink mb-2 text-center font-spooky">Jugar Juegos</h1>
                 <p className="text-ink/70 text-center mb-8">¡Gana monedas y XP para ampliar tu colección de gatos!</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(GAMES_DATA).map(([id, game]) => (
                        <button key={id} onClick={() => setSelectedGameId(id)} className="game-select-card card-themed p-6 text-center">
                            <div className="text-primary mx-auto mb-4">
                                {gameIcons[id] || <CatSilhouetteIcon className="w-16 h-16"/>}
                            </div>
                            <h2 className="text-2xl font-bold font-spooky">{game.name}</h2>
                            <p className="text-ink/70">{game.description}</p>
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="container mx-auto p-4 sm:p-6">
            {renderContent()}
        </div>
    );
};

export default GameModeSelector;