// gameData/missions.ts

export interface MissionData {
    id: string;
    title: string;
    description: string;
    rewardXp: number;
    type: 'PLAY_GAMES' | 'LIKE_PHRASES' | 'SEND_TRADE';
    goal: number;
}

export const ALL_MISSIONS: MissionData[] = [
    // Play Games
    {
        id: 'play_5_games',
        title: "Compañeros de Juego",
        description: "Juega 5 partidas en cualquier modo de juego (cada uno).",
        rewardXp: 100,
        type: 'PLAY_GAMES',
        goal: 5,
    },
    {
        id: 'play_15_games',
        title: "Dúo Dinámico",
        description: "Juega 15 partidas en cualquier modo de juego (cada uno).",
        rewardXp: 250,
        type: 'PLAY_GAMES',
        goal: 15,
    },
    // Like Phrases
    {
        id: 'like_5_phrases',
        title: "Apoyo Mutuo",
        description: "Dale 'me gusta' a 5 frases públicas de tu amigo.",
        rewardXp: 75,
        type: 'LIKE_PHRASES',
        goal: 5,
    },
    {
        id: 'like_10_phrases',
        title: "Club de Fans",
        description: "Dale 'me gusta' a 10 frases públicas de tu amigo.",
        rewardXp: 150,
        type: 'LIKE_PHRASES',
        goal: 10,
    },
    // Trading
    {
        id: 'send_1_trade',
        title: "Primer Intercambio",
        description: "Envía una oferta de intercambio a tu amigo (no necesita ser aceptada).",
        rewardXp: 50,
        type: 'SEND_TRADE',
        goal: 1,
    },
    {
        id: 'send_3_trades',
        title: "Comerciantes",
        description: "Envía 3 ofertas de intercambio a tu amigo.",
        rewardXp: 120,
        type: 'SEND_TRADE',
        goal: 3,
    },
];