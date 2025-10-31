// api/missions.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_utils/mongodb.js';
import { verifyToken } from './_utils/auth.js';
import { Db } from 'mongodb';
import { updateDailyMissionProgress } from './_utils/missions.js';
import { GoogleGenAI } from '@google/genai';
import { ChatMessage } from '../../types.js';

async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const decodedToken = await verifyToken(req.headers.authorization);
        const userId = decodedToken.sub;
        const db = await getDb();
        const { action } = req.body;

        if (action === 'claimReward') {
            return await handleClaimReward(req, res, db, userId);
        }
        
        if (action === 'chat') {
            return await handleChat(req, res, db, userId);
        }

        return res.status(400).json({ message: "Invalid action." });

    } catch (error) {
        console.error('Missions API error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ message: 'Internal Server Error', error: errorMessage });
    }
}

async function handleClaimReward(req: VercelRequest, res: VercelResponse, db: Db, userId: string) {
    const { missionId } = req.body;
    if (!missionId) {
        return res.status(400).json({ message: "missionId is required." });
    }

    const users = db.collection('users');
    const user = await users.findOne({ _id: userId as any });
    if (!user) return res.status(404).json({ message: "User not found." });

    const mission = user.data.dailyMissions?.find((m: any) => m.id === missionId);

    if (!mission || mission.isClaimed || mission.progress < mission.goal) {
        return res.status(400).json({ message: "Mission not available to claim." });
    }

    const updatedMissions = user.data.dailyMissions.map((m: any) => 
        m.id === missionId ? { ...m, isClaimed: true } : m
    );

    await users.updateOne(
        { _id: userId as any },
        {
            $inc: {
                "data.coins": mission.rewardCoins,
                "data.playerStats.xp": mission.rewardXp
            },
            $set: {
                "data.dailyMissions": updatedMissions
            }
        }
    );

    const updatedProfile = await users.findOne({ _id: userId as any });
    return res.status(200).json(updatedProfile);
}

async function handleChat(req: VercelRequest, res: VercelResponse, db: Db, userId: string) {
    const { history } = req.body;
    if (!history || !Array.isArray(history)) {
        return res.status(400).json({ message: "Chat history is required." });
    }

    // Update CHAT_WITH_PICTO mission progress on first interaction
    if (history.length === 1) {
        await updateDailyMissionProgress(db, userId, 'CHAT_WITH_PICTO', 1);
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.PICTOCAT1_GEMINI_API_KEY });
        const geminiHistory = history.map((msg: ChatMessage) => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        }));
        
        // Remove last message to use as current prompt
        const lastMessage = geminiHistory.pop();
        if (!lastMessage || lastMessage.role !== 'user') {
            return res.status(400).json({ message: "Invalid chat history format." });
        }

        const model = 'gemini-2.5-flash';

        const response = await ai.models.generateContent({
          model: model,
          contents: {
            role: 'user', // This is correct, as the last message is from the user
            parts: lastMessage.parts,
          },
          config: {
            systemInstruction: "You are Picto, a helpful and slightly quirky cat assistant for a game called PictoCat. Your personality is friendly, curious, and you love cat puns. Keep your answers concise and fun. You are talking to a player of the game. You can give tips, tell jokes, or just chat. The game involves collecting cat pictures, assigning them to phrases, and playing minigames.",
          },
        });
        
        const replyText = response.text;
        
        return res.status(200).json({ reply: replyText });

    } catch (e) {
        console.error("Gemini API Error:", e);
        return res.status(500).json({ message: "Error communicating with AI assistant." });
    }
}


export default handler;
