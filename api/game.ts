// api/game.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_utils/mongodb.js';
import { verifyToken } from './_utils/auth.js';
import { updateMissionProgress } from './friends.js';
import { Db } from 'mongodb';
import { DailyMission, PassReward, UserProfile } from '../../types.js';

// --- Mission & Pass Definitions (would be in a separate file/collection in a larger app) ---
const ALL_DAILY_MISSIONS: Omit<DailyMission, 'progress' | 'isCompleted'>[] = [
    { id: 'play_3_games', description: 'Juega 3 partidas en la Sala de Juegos', goal: 3, rewardPaws: 30 },
    { id: 'open_1_envelope', description: 'Abre 1 sobre de la tienda', goal: 1, rewardPaws: 20 },
    { id: 'like_5_phrases', description: 'Da "Me Gusta" a 5 frases en la comunidad', goal: 5, rewardPaws: 25 },
    { id: 'earn_200_coins', description: 'Gana 200 monedas jugando', goal: 200, rewardPaws: 40 },
];

const CAT_PASS_REWARDS: PassReward[] = Array.from({ length: 50 }, (_, i) => {
    const level = i + 1;
    const reward: PassReward = { level };
    if (level % 5 === 0) {
        reward.free = { type: 'envelope', value: 'silver' };
        reward.premium = { type: 'fishTokens', value: 50 };
    } else if (level % 2 === 0) {
        reward.free = { type: 'coins', value: 100 * level };
        reward.premium = { type: 'coins', value: 300 * level };
    } else {
        reward.premium = { type: 'envelope', value: 'bronze' };
    }
    // Special rewards
    if(level === 10) reward.premium = { type: 'cat', value: 8 }; // Example epic cat
    if(level === 25) reward.premium = { type: 'cat', value: 10}; // Example epic cat
    if(level === 50) reward.premium = { type: 'cat', value: 39}; // Example shiny cat
    return reward;
});

// --- Helper Functions ---
const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

async function getOrRefreshMissions(user: UserProfile['data']): Promise<DailyMission[]> {
    const lastReset = new Date(user.dailyMissions?.lastReset || 0);
    const now = new Date();
    
    if (!user.dailyMissions || !isSameDay(lastReset, now) || user.dailyMissions.missions.length === 0) {
        const shuffled = [...ALL_DAILY_MISSIONS].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3).map(m => ({ ...m, progress: 0, isCompleted: false }));
    }
    return user.dailyMissions.missions;
}


async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const decodedToken = await verifyToken(req.headers.authorization);
        const userId = decodedToken.sub;
        const db = await getDb();
        const users = db.collection('users');
        const currentUser = await users.findOne({ _id: userId as any });

        if (!currentUser) return res.status(404).json({ message: "User not found" });

        if (req.method === 'GET') {
            const { resource } = req.query;
            if (resource === 'missions') {
                const missions = await getOrRefreshMissions(currentUser.data);
                if (!isSameDay(new Date(currentUser.data.dailyMissions?.lastReset || 0), new Date()) || currentUser.data.dailyMissions.missions.length === 0) {
                     await users.updateOne({_id: userId as any}, { $set: { "data.dailyMissions": { lastReset: new Date().toISOString(), missions: missions } }});
                }
                return res.status(200).json(missions);
            }
            if (resource === 'catpass_rewards') {
                return res.status(200).json(CAT_PASS_REWARDS);
            }
        }

        if (req.method === 'POST') {
            const { action, results, missionId, level, type, missionType, amount } = req.body;
            if (action === 'saveResults') return await saveGameResults(res, db, userId, results);
            if (action === 'claimMission') return await claimMission(res, db, userId, missionId);
            if (action === 'claimPassReward') return await claimPassReward(res, db, userId, level, type);
            if (action === 'progressMission') return await progressMission(res, db, userId, missionType, amount);
            if (action === 'completeRandomMission') return await completeRandomMission(res, db, userId);
        }
        
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);

    } catch (error) {
        console.error('Game API error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ message: 'Internal Server Error', error: errorMessage });
    }
}

async function progressMission(res: VercelResponse, db: Db, userId: string, missionType: string, amount: number) {
    const users = db.collection('users');
    const user = await users.findOne({ _id: userId as any });
    if (!user) return res.status(404).json({ message: "User not found." });

    const currentMissions = await getOrRefreshMissions(user.data);
    
    const missionToUpdate = currentMissions.find(m => m.id.startsWith(missionType));
    if (missionToUpdate && !missionToUpdate.isCompleted) {
        missionToUpdate.progress = Math.min(missionToUpdate.goal, missionToUpdate.progress + amount);
        if (missionToUpdate.progress >= missionToUpdate.goal) {
            missionToUpdate.isCompleted = true;
        }
        await users.updateOne({ _id: userId as any }, { $set: { "data.dailyMissions.missions": currentMissions }});
    }
    return res.status(200).json({ success: true });
}


async function saveGameResults(res: VercelResponse, db: Db, userId: string, results: { coinsEarned: number; xpEarned: number }) {
    if (!results || typeof results.coinsEarned !== 'number' || typeof results.xpEarned !== 'number') {
        return res.status(400).json({ message: "Invalid game results." });
    }
    
    const users = db.collection('users');
    const user = await users.findOne({_id: userId as any});
    const missions = await getOrRefreshMissions(user.data);
    let missionsUpdated = false;

    missions.forEach(m => {
        if (m.isCompleted) return;
        if (m.id.startsWith('play_') && results.xpEarned > 0) m.progress++;
        if (m.id.startsWith('earn_') && results.coinsEarned > 0) m.progress += results.coinsEarned;
        
        if (m.progress >= m.goal) {
            m.isCompleted = true;
        }
        missionsUpdated = true;
    });

    const updateQuery: any = {
        $inc: { "data.coins": results.coinsEarned, "data.playerStats.xp": results.xpEarned }
    };

    if (missionsUpdated) {
        updateQuery.$set = { "data.dailyMissions.missions": missions };
    }
    
    await users.updateOne({ _id: userId as any }, updateQuery);
    
    // ... rest of the logic (friend bonus, etc.)
    const updatedProfile = await users.findOne({ _id: userId as any });
    return res.status(200).json(updatedProfile);
}

async function claimMission(res: VercelResponse, db: Db, userId: string, missionId: string) {
    const users = db.collection('users');
    const user = await users.findOne({_id: userId as any});
    const missions = await getOrRefreshMissions(user.data);

    const mission = missions.find(m => m.id === missionId);
    if (!mission || !mission.isCompleted) return res.status(400).json({message: "Misión no completada o inválida."});
    
    const missionIndex = missions.findIndex(m => m.id === missionId);
    if (missionIndex === -1) return res.status(404).json({message: "Misión no encontrada para reclamar."});
    
    missions[missionIndex].id = `claimed_${missions[missionIndex].id}`;

    let { paws, level, pawsToNextLevel } = user.data.catPass;
    paws += mission.rewardPaws;
    while(paws >= pawsToNextLevel) {
        paws -= pawsToNextLevel;
        level++;
        pawsToNextLevel = Math.floor(pawsToNextLevel * 1.1);
    }
    
    await users.updateOne({_id: userId as any}, {
        $set: {
            "data.dailyMissions.missions": missions,
            "data.catPass.paws": paws,
            "data.catPass.level": level,
            "data.catPass.pawsToNextLevel": pawsToNextLevel,
        }
    });

    const updatedProfile = await users.findOne({_id: userId as any});
    return res.status(200).json({ updatedProfile });
}

async function completeRandomMission(res: VercelResponse, db: Db, userId: string) {
    const users = db.collection('users');
    const user = await users.findOne({_id: userId as any});
    if (!user) return res.status(404).json({ message: "User not found." });

    const missions = await getOrRefreshMissions(user.data);
    const incompleteMission = missions.find(m => !m.isCompleted);

    if (incompleteMission) {
        incompleteMission.isCompleted = true;
        await users.updateOne({_id: userId as any}, {
            $set: { "data.dailyMissions.missions": missions }
        });
    }
    
    const updatedProfile = await users.findOne({_id: userId as any});
    return res.status(200).json({ updatedProfile });
}


async function claimPassReward(res: VercelResponse, db: Db, userId: string, level: number, type: 'free' | 'premium') {
    const users = db.collection('users');
    const user = await users.findOne({_id: userId as any});
    const catPass = user.data.catPass;

    if (level > catPass.level) return res.status(400).json({message: "Nivel no alcanzado."});
    if (type === 'premium' && !catPass.isPremium) return res.status(400).json({message: "Requiere Pase Premium."});
    if (catPass.claimedLevels[type].includes(level)) return res.status(400).json({message: "Recompensa ya reclamada."});

    const reward = CAT_PASS_REWARDS.find(r => r.level === level)?.[type];
    if (!reward) return res.status(404).json({message: "Recompensa no encontrada."});
    
    const updateQuery: any = { $push: { [`data.catPass.claimedLevels.${type}`]: level } };
    
    switch(reward.type) {
        case 'coins': updateQuery.$inc = { "data.coins": reward.value }; break;
        case 'fishTokens': updateQuery.$inc = { "data.fishTokens": reward.value }; break;
        case 'cat': updateQuery.$addToSet = { "data.unlockedImageIds": reward.value }; break;
        // Envelopes are handled on the client side for now. Could be expanded to grant items.
    }

    await users.updateOne({_id: userId as any}, updateQuery);
    const updatedProfile = await users.findOne({_id: userId as any});
    return res.status(200).json({ updatedProfile });
}


export default handler;