// api/shop.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_utils/mongodb.js';
import { verifyToken } from './_utils/auth.js';
import { CatImage, Envelope, EnvelopeTypeId, ShopFeaturedItem } from '../../types.js';


const calculateEnvelopeCost = (envelope: Envelope, playerLevel: number): number => {
  return envelope.baseCost + ((playerLevel - 1) * envelope.costIncreasePerLevel);
};


async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const db = await getDb();

        if (req.method === 'GET') {
            const { resource } = req.query;
            if (resource === 'data') {
                const envelopesCollection = db.collection('envelopes');
                const upgradesCollection = db.collection('upgrades');
                const catsCollection = db.collection('cat_images');

                const [envelopes, upgrades, featuredCats] = await Promise.all([
                    envelopesCollection.find({}).sort({ baseCost: 1 }).toArray(),
                    upgradesCollection.find({}).sort({ levelRequired: 1 }).toArray(),
                    catsCollection.aggregate([ { $match: { rarity: 'epic' } }, { $sample: { size: 3 } } ]).toArray()
                ]);
                
                const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Expires in 24 hours
                const featured: ShopFeaturedItem[] = featuredCats.map(cat => ({
                    catId: cat.id,
                    cost: 150, // Example cost
                    currency: 'fishTokens',
                    expiresAt,
                }));

                return res.status(200).json({ envelopes, upgrades, featured });
            }
        }
        
        // All other methods require auth
        const decodedToken = await verifyToken(req.headers.authorization);
        const userId = decodedToken.sub;
        const users = db.collection('users');
        const catalog = db.collection('cat_images');
        const transactions = db.collection('transactions');

        let currentUser = await users.findOne({ _id: userId as any });
        if (!currentUser) {
            return res.status(404).json({ message: "User not found." });
        }

        if (req.method === 'POST') {
            const { action, envelopeId, catId, level, type } = req.body;
            
            if (action === 'purchaseEnvelope') {
                const envelopesCollection = db.collection('envelopes');
                const envelope = await envelopesCollection.findOne({ id: envelopeId as EnvelopeTypeId });

                if (!envelope) return res.status(400).json({ message: "Invalid envelopeId." });
                
                const themeQuery = (envelope.catThemePool && envelope.catThemePool.length > 0)
                    ? { theme: { $in: envelope.catThemePool } }
                    : {};

                const allImagesInPool = await catalog.find(themeQuery).project({_id: 0, specialAbility: 1, id: 1 }).toArray();
                const unlockedIds = new Set(currentUser.data.unlockedImageIds || []);
                const remainingImages = allImagesInPool.filter(img => !unlockedIds.has(img.id));

                if (remainingImages.length === 0) return res.status(400).json({ message: "Ya tienes todos los gatos de este sobre." });
                
                const imagesToGetCount = Math.min(remainingImages.length, envelope.imageCount);
                const originalCost = calculateEnvelopeCost(envelope as any, currentUser.data.playerStats.level);
                
                const proratedCost = envelope.imageCount > 0 
                    ? Math.ceil(originalCost * (imagesToGetCount / envelope.imageCount))
                    : originalCost;

                if (currentUser.data.coins < proratedCost) return res.status(402).json({ message: "Not enough coins." });
                
                const shuffledRemaining = remainingImages.sort(() => 0.5 - Math.random());
                const newImages = shuffledRemaining.slice(0, imagesToGetCount);
                const newImageIds = newImages.map(img => img.id);

                await transactions.insertOne({ userId, date: new Date().toISOString(), description: `Compra: ${envelope.name}`, amount: -proratedCost, currency: 'coins' });
                
                await users.updateOne(
                    { _id: userId as any },
                    {
                        $inc: { 'data.coins': -proratedCost },
                        $addToSet: { 'data.unlockedImageIds': { $each: newImageIds } }
                    }
                );
                
                const fullNewImages = await catalog.find({ id: { $in: newImageIds } }).project({_id: 0}).toArray();
                const updatedProfileDoc = await users.findOne({ _id: userId as any });
                return res.status(200).json({ updatedProfile: updatedProfileDoc, newImages: fullNewImages });
            }

            if (action === 'purchaseFeaturedCat') {
                const featuredItem = (await db.collection('cat_images').findOne({ id: catId, rarity: 'epic' })) 
                    ? { catId, cost: 150, currency: 'fishTokens' } : null; // simplified logic
                
                if (!featuredItem) return res.status(404).json({ message: "Item no encontrado." });
                if (currentUser.data.fishTokens < featuredItem.cost) return res.status(402).json({ message: "No tienes suficientes Fichas de Pescado." });
                
                await transactions.insertOne({ userId, date: new Date().toISOString(), description: `Compra Gato Destacado #${catId}`, amount: -featuredItem.cost, currency: 'fishTokens' });

                await users.updateOne(
                    { _id: userId as any },
                    {
                        $inc: { 'data.fishTokens': -featuredItem.cost },
                        $addToSet: { 'data.unlockedImageIds': catId }
                    }
                );
                
                const updatedProfile = await users.findOne({ _id: userId as any });
                return res.status(200).json({ updatedProfile });
            }

            if (action === 'purchasePremiumPass') {
                const cost = 500; // Hardcoded cost
                if (currentUser.data.catPass.isPremium) return res.status(400).json({ message: "Ya tienes el pase premium."});
                if (currentUser.data.fishTokens < cost) return res.status(402).json({ message: "No tienes suficientes Fichas de Pescado." });

                await transactions.insertOne({ userId, date: new Date().toISOString(), description: `Compra Pase Gatuno Premium`, amount: -cost, currency: 'fishTokens' });
                
                await users.updateOne(
                    { _id: userId as any },
                    {
                        $inc: { 'data.fishTokens': -cost },
                        $set: { 'data.catPass.isPremium': true }
                    }
                );
                
                const updatedProfile = await users.findOne({ _id: userId as any });
                return res.status(200).json({ updatedProfile });
            }
        }
        
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);

    } catch (error) {
        console.error('Shop API error:', error);
        if (error instanceof Error && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ message: 'Internal Server Error', error: errorMessage });
    }
}

export default handler;