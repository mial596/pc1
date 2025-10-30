// services/audioService.ts

// A simple sound service to manage and play audio effects.
class SoundService {
    private sounds: { [key: string]: HTMLAudioElement } = {};
    private isMuted = false;

    // Preload common sounds
    constructor() {
        // Paths are hypothetical, assuming a public/sounds directory
        this.load('select', '/sounds/select.wav');
        this.load('reward', '/sounds/reward.wav');
        this.load('gameOver', '/sounds/gameOver.wav');
        this.load('catMeow', '/sounds/catMeow.mp3');
        this.load('mouseSqueak', '/sounds/mouseSqueak.wav');
        this.load('favoriteOn', '/sounds/favoriteOn.wav');
        this.load('favoriteOff', '/sounds/favoriteOff.wav');
        this.load('simonError', '/sounds/simonError.wav');
        this.load('simon1', '/sounds/simon1.mp3');
        this.load('simon2', '/sounds/simon2.mp3');
        this.load('simon3', '/sounds/simon3.mp3');
        this.load('simon4', '/sounds/simon4.mp3');
    }

    private load(name: string, src: string) {
        if (typeof window !== 'undefined') {
            const audio = new Audio(src);
            audio.preload = 'auto';
            this.sounds[name] = audio;
        }
    }

    play(name: string) {
        if (this.isMuted || !this.sounds[name] || typeof window === 'undefined') {
            return;
        }
        // Clone the node to play multiple sounds at once
        const soundToPlay = this.sounds[name].cloneNode(true) as HTMLAudioElement;
        soundToPlay.play().catch(error => console.error(`Error playing sound ${name}:`, error));
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
    }
}

// A simple Text-to-Speech service using the browser's Web Speech API.
class TTSService {
    private synth: SpeechSynthesis | null = null;
    private voices: SpeechSynthesisVoice[] = [];

    constructor() {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            this.synth = window.speechSynthesis;
            // The 'voiceschanged' event might fire immediately or after some time.
            const loadVoices = () => {
                if (this.synth) {
                    this.voices = this.synth.getVoices();
                }
            };
            loadVoices();
            if (this.synth && this.synth.onvoiceschanged !== undefined) {
                 this.synth.onvoiceschanged = loadVoices;
            }
        }
    }

    speak(text: string) {
        if (!this.synth) {
            console.warn("Speech synthesis not available.");
            return;
        }

        if (this.synth.speaking) {
            this.synth.cancel();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Find a Spanish voice if possible, which is the primary language of the app
        const spanishVoice = this.voices.find(voice => voice.lang.startsWith('es'));
        if (spanishVoice) {
            utterance.voice = spanishVoice;
        } else {
            utterance.lang = 'es-ES'; // Fallback lang
        }
        
        utterance.pitch = 1;
        utterance.rate = 1;
        this.synth.speak(utterance);
    }
}

export const soundService = new SoundService();
export const ttsService = new TTSService();
