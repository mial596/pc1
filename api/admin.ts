// api/admin.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_utils/mongodb.js';
import { verifyToken } from './_utils/auth.js';
import { ObjectId } from 'mongodb';
import { MASTER_IMAGE_CATALOG_DATA } from './_shared/catalog-data.js';
import { CatImage, Envelope, TradeOffer } from '../../types.js';

async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const decodedToken = await verifyToken(req.headers.authorization);
        const db = await getDb();
        const usersCollection = db.collection('users');

        const requestingUser = await usersCollection.findOne({ _id: decodedToken.sub as any });
        if (!requestingUser || requestingUser.role !== 'admin') {
            return res.status(403).send('Forbidden: Admins only.');
        }

        if (req.method === 'GET') {
            return await handleGet(req, res, db);
        }

        if (req.method === 'POST') {
            return await handlePost(req, res, db);
        }

        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);

    } catch (error) {
        console.error('Admin API error:', error);
        if (error instanceof Error && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ message: 'Internal Server Error', error: errorMessage });
    }
}

async function handleGet(req: VercelRequest, res: VercelResponse, db: any) {
    const { resource } = req.query;

    if (resource === 'users') {
        const usersCursor = db.collection('users').find({}, {
            projection: { _id: 1, username: 1, role: 1, isVerified: 1 },
            sort: { username: 1 }
        });
        const users = await usersCursor.toArray();
        const result = users.map((u: any) => ({
            id: u._id,
            username: u.username,
            role: u.role,
            isVerified: u.isVerified
        }));
        return res.status(200).json(result);
    }

    if (resource === 'phrases') {
        const phrasesCursor = db.collection('public_phrases').find({}).sort({ _id: -1 });
        const phrases = await phrasesCursor.toArray();
        const result = phrases.map((p: any) => ({
            publicPhraseId: p._id.toHexString(),
            userId: p.userId,
            email: p.username,
            text: p.text,
            imageUrl: p.imageUrl,
            imageTheme: p.imageTheme,
        }));
        return res.status(200).json(result);
    }
    
    if (resource === 'cats') {
        // Migration: ensure all cats have isShiny field
        await db.collection('cat_images').updateMany({ isShiny: { $exists: false } }, { $set: { isShiny: false } });
        const cats = await db.collection('cat_images').find({}).sort({ id: 1 }).toArray();
        return res.status(200).json(cats);
    }
    
    if (resource === 'envelopes') {
        const envelopes = await db.collection('envelopes').find({}).sort({ baseCost: 1 }).toArray();
        return res.status(200).json(envelopes);
    }

    if (resource === 'themes') {
        const themes = await db.collection('cat_images').distinct('theme');
        return res.status(200).json(themes);
    }
    
    if (resource === 'trades') {
        const trades = await db.collection('trades').find({}).sort({ createdAt: -1 }).toArray();
        return res.status(200).json(trades);
    }
    
    if (resource === 'settings') {
        let settings = await db.collection('game_settings').findOne({ _id: 'main' });
        if (!settings) {
            settings = { _id: 'main', rarityValues: { common: 10, rare: 50, epic: 200 } };
            await db.collection('game_settings').insertOne(settings);
        }
        return res.status(200).json(settings);
    }

    return res.status(400).send('Invalid resource requested.');
}

async function handlePost(req: VercelRequest, res: VercelResponse, db: any) {
    const { action } = req.body;

    if (action === 'setVerified') {
        const { userId, isVerified } = req.body;
        if (!userId || typeof isVerified !== 'boolean') {
            return res.status(400).send('userId and isVerified status are required.');
        }
        await db.collection('users').updateOne({ _id: userId as any }, { $set: { isVerified: isVerified } });
        return res.status(200).json({ success: true });
    }

    if (action === 'censorPhrase') {
        const { publicPhraseId } = req.body;
        if (!publicPhraseId) {
            return res.status(400).send('publicPhraseId is required.');
        }
        const phraseToDelete = await db.collection('public_phrases').findOne({ _id: new ObjectId(publicPhraseId) });
        if (phraseToDelete) {
            await db.collection('public_phrases').deleteOne({ _id: new ObjectId(publicPhraseId) });
            await db.collection('users').updateOne(
                { _id: phraseToDelete.userId as any, 'phrases.id': phraseToDelete.phraseId },
                { $set: { 'phrases.$.isPublic': false } }
            );
        }
        return res.status(200).json({ success: true });
    }

    if (action === 'addCat') {
        const { url, theme, rarity, isShiny } = req.body;
        if (!url || !theme || !rarity) {
            return res.status(400).json({ message: "URL, theme, and rarity are required." });
        }
        const cats = db.collection('cat_images');
        const lastCat = await cats.find().sort({ id: -1 }).limit(1).toArray();
        const nextId = lastCat.length > 0 ? lastCat[0].id + 1 : 1;

        const newCat: Omit<CatImage, 'id'> & {id: number} = { id: nextId, url, theme, rarity, isShiny: !!isShiny };
        await cats.insertOne(newCat);
        return res.status(201).json({ success: true });
    }

    if (action === 'editCat') {
        const { id, url, theme, rarity, isShiny } = req.body;
        if (!id || !url || !theme || !rarity) {
            return res.status(400).json({ message: "ID, URL, theme, and rarity are required." });
        }
        await db.collection('cat_images').updateOne({ id: Number(id) }, { $set: { url, theme, rarity, isShiny: !!isShiny } });
        return res.status(200).json({ success: true });
    }

    if (action === 'addEnvelope' || action === 'editEnvelope') {
        const envelopeData: Envelope = req.body;
        const { id, name, baseCost } = envelopeData;
        if (!id || !name || baseCost === undefined) {
            return res.status(400).json({ message: "ID, name, and baseCost are required." });
        }
        await db.collection('envelopes').updateOne({ id: id }, { $set: envelopeData }, { upsert: true });
        return res.status(200).json({ success: true });
    }
    
    if (action === 'deleteEnvelope') {
        const { envelopeId } = req.body;
        if (!envelopeId) {
            return res.status(400).json({ message: "envelopeId is required." });
        }
        await db.collection('envelopes').deleteOne({ id: envelopeId });
        return res.status(200).json({ success: true });
    }

    if (action === 'importCatCatalog') {
        const catsCollection = db.collection('cat_images');
        await catsCollection.createIndex({ url: 1 }, { unique: true });

        const allCatsSeed = Object.values(MASTER_IMAGE_CATALOG_DATA).flat();
        const existingUrls = new Set((await catsCollection.find({}, { projection: { url: 1, _id: 0 } }).toArray()).map((c: {url: string}) => c.url));
        
        const newCatsToInsert = [];
        let lastCatArr = await catsCollection.find().sort({ id: -1 }).limit(1).toArray();
        let nextId = lastCatArr.length > 0 ? lastCatArr[0].id + 1 : 1;
        
        for (const catSeed of allCatsSeed) {
            if (!existingUrls.has(catSeed.url)) {
                newCatsToInsert.push({
                    id: nextId,
                    url: catSeed.url,
                    theme: catSeed.theme,
                    rarity: catSeed.rarity,
                    isShiny: false,
                });
                nextId++;
            }
        }

        if (newCatsToInsert.length > 0) {
            await catsCollection.insertMany(newCatsToInsert);
        }

        return res.status(200).json({ success: true, message: `Imported ${newCatsToInsert.length} new cats.` });
    }

    if (action === 'cancelTrade') {
        const { tradeId } = req.body;
        if (!tradeId) return res.status(400).json({ message: "tradeId is required." });

        const result = await db.collection('trades').updateOne(
            { _id: new ObjectId(tradeId), status: 'pending' },
            { $set: { status: 'cancelled', reason: 'Cancelled by moderator.' } }
        );
        if (result.matchedCount === 0) return res.status(404).json({ message: "Pending trade not found." });
        return res.status(200).json({ success: true });
    }

    if (action === 'saveSettings') {
        const { settings } = req.body;
        if (!settings) return res.status(400).json({ message: "Settings object is required." });
        await db.collection('game_settings').updateOne({ _id: 'main' }, { $set: settings }, { upsert: true });
        return res.status(200).json({ success: true });
    }


    return res.status(400).send('Invalid action requested.');
}

export default handler;