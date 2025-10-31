import { DailyMission, DailyMissionType } from '../../types';

type MissionTemplate = Omit<DailyMission, 'progress' | 'isClaimed'>;

export const ALL_DAILY_MISSIONS: MissionTemplate[] = [
    {
        id: 'play_1_game',
        description: 'Juega 1 partida en cualquier modo',
        type: 'PLAY_ANY_GAME',
        goal: 1,
        rewardCoins: 50,
        rewardXp: 25,
    },
    {
        id: 'play_3_games',
        description: 'Juega 3 partidas en cualquier modo',
        type: 'PLAY_ANY_GAME',
        goal: 3,
        rewardCoins: 150,
        rewardXp: 75,
    },
    {
        id: 'open_1_envelope',
        description: 'Abre 1 sobre de la tienda',
        type: 'OPEN_ENVELOPE',
        goal: 1,
        rewardCoins: 100,
        rewardXp: 50,
    },
    {
        id: 'like_1_phrase',
        description: "Dale 'me gusta' a una frase pública",
        type: 'LIKE_PUBLIC_PHRASE',
        goal: 1,
        rewardCoins: 30,
        rewardXp: 15,
    },
    {
        id: 'like_3_phrases',
        description: "Dale 'me gusta' a 3 frases públicas",
        type: 'LIKE_PUBLIC_PHRASE',
        goal: 3,
        rewardCoins: 100,
        rewardXp: 40,
    },
    {
        id: 'chat_with_picto',
        description: 'Habla con el gato asistente Picto',
        type: 'CHAT_WITH_PICTO',
        goal: 1,
        rewardCoins: 75,
        rewardXp: 30,
    }
];
