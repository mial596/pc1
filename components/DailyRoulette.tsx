import React, { useState, useEffect, useCallback } from 'react';
import { LeafCoinIcon } from '../hooks/Icons';
import { soundService } from '../services/audioService';

interface DailyRouletteProps {
    onWin: (coins: number) => void;
}

const PRIZES = [50, 200, 10, 500, 25, 100, 75, 150];
const SEGMENT_ANGLE = 360 / PRIZES.length;

const PrizeModal: React.FC<{ coins: number; onClose: () => void }> = ({ coins, onClose }) => (
    <div className="modal-themed-overlay">
        <div className="modal-themed-content w-full max-w-sm text-center p-6">
            <LeafCoinIcon className="w-24 h-24 text-accent mx-auto animate-bounce" />
            <h2 className="text-3xl font-black font-display mt-4">¡Felicidades!</h2>
            <p className="text-xl mt-2">Has ganado</p>
            <p className="text-5xl font-black text-primary my-4 font-display">{coins} Monedas</p>
            <button onClick={onClose} className="btn-themed btn-themed-primary w-full">¡Genial!</button>
        </div>
    </div>
);

const DailyRoulette: React.FC<DailyRouletteProps> = ({ onWin }) => {
    const [canSpin, setCanSpin] = useState(false);
    const [isSpinning, setIsSpinning] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');
    const [rotation, setRotation] = useState(0);
    const [prizeWon, setPrizeWon] = useState<number | null>(null);

    const checkSpinStatus = useCallback(() => {
        const lastSpin = localStorage.getItem('pictocat_last_spin');
        if (!lastSpin) {
            setCanSpin(true);
            return;
        }

        const nextSpinTime = parseInt(lastSpin, 10) + 24 * 60 * 60 * 1000;
        const now = Date.now();

        if (now >= nextSpinTime) {
            setCanSpin(true);
            setTimeLeft('');
        } else {
            setCanSpin(false);
            const updateTimer = () => {
                const remaining = nextSpinTime - Date.now();
                if (remaining <= 0) {
                    setCanSpin(true);
                    setTimeLeft('');
                    return;
                }
                const hours = Math.floor(remaining / (1000 * 60 * 60));
                const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
                setTimeLeft(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
            };
            updateTimer();
            const interval = setInterval(updateTimer, 1000);
            return () => clearInterval(interval);
        }
    }, []);

    useEffect(() => {
        return checkSpinStatus();
    }, [checkSpinStatus]);

    const handleSpin = () => {
        if (!canSpin || isSpinning) return;

        setIsSpinning(true);
        soundService.play('select');
        const prizeIndex = Math.floor(Math.random() * PRIZES.length);
        const prize = PRIZES[prizeIndex];

        const randomOffset = Math.random() * (SEGMENT_ANGLE - 10) + 5;
        const targetRotation = 360 * 5 - (prizeIndex * SEGMENT_ANGLE + randomOffset);

        setRotation(prev => prev + targetRotation);

        setTimeout(() => {
            setIsSpinning(false);
            setCanSpin(false);
            localStorage.setItem('pictocat_last_spin', String(Date.now()));
            setPrizeWon(prize);
            onWin(prize);
            checkSpinStatus();
        }, 5500); // 5000ms for spin + 500ms buffer
    };

    return (
        <div className="flex flex-col items-center p-6 bg-surface rounded-lg">
            {prizeWon !== null && <PrizeModal coins={prizeWon} onClose={() => setPrizeWon(null)} />}
            <h2 className="text-3xl font-bold font-display mb-2">Ruleta Diaria</h2>
            <p className="text-ink/70 mb-4">¡Gira una vez al día para ganar monedas gratis!</p>
            
            <div className="roulette-container">
                <div className="roulette-pointer"></div>
                <div className="roulette-wheel" style={{ transform: `rotate(${rotation}deg)` }}>
                     {PRIZES.map((_, index) => (
                         <div key={index} className="segment-line" style={{ transform: `rotate(${index * SEGMENT_ANGLE}deg)` }}></div>
                    ))}
                    {PRIZES.map((prize, index) => (
                        <div key={index} className="segment" style={{ transform: `rotate(${index * SEGMENT_ANGLE + SEGMENT_ANGLE / 2}deg)` }}>
                            <span style={{ transform: `rotate(-90deg)` }}>{prize}</span>
                        </div>
                    ))}
                </div>
                <div className="roulette-center"></div>
            </div>

            {canSpin ? (
                <button onClick={handleSpin} disabled={isSpinning} className="btn-themed btn-themed-primary text-xl w-full max-w-xs">
                    {isSpinning ? 'Girando...' : '¡GIRAR!'}
                </button>
            ) : (
                <div className="text-center font-bold text-lg card-themed p-3 w-full max-w-xs">
                    <p>Vuelve en:</p>
                    <p className="text-2xl text-primary font-display">{timeLeft}</p>
                </div>
            )}
        </div>
    );
};

export default DailyRoulette;