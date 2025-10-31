// api/admin.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_utils/mongodb.js';
import { verifyToken } from './_utils/auth.js';
import { ObjectId } from 'mongodb';
import { MASTER_IMAGE_CATALOG_DATA } from './_shared/catalog-data.js';

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
        const { url, theme, rarity } = req.body;
        if (!url || !theme || !rarity) {
            return res.status(400).json({ message: "URL, theme, and rarity are required." });
        }
        const cats = db.collection('cat_images');
        const lastCat = await cats.find().sort({ id: -1 }).limit(1).toArray();
        const nextId = lastCat.length > 0 ? lastCat[0].id + 1 : 1;

        const newCat = { id: nextId, url, theme, rarity };
        await cats.insertOne(newCat);
        return res.status(201).json({ success: true });
    }

    if (action === 'addEnvelope') {
        const envelopeData = req.body;
        delete envelopeData.action; // Remove action field before inserting

        if (!envelopeData.id || !envelopeData.name || !envelopeData.baseCost) {
            return res.status(400).json({ message: "ID, name, and baseCost are required." });
        }

        await db.collection('envelopes').insertOne(envelopeData);
        return res.status(201).json({ success: true });
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
                });
                nextId++;
            }
        }

        if (newCatsToInsert.length > 0) {
            await catsCollection.insertMany(newCatsToInsert);
        }

        return res.status(200).json({ success: true, message: `Imported ${newCatsToInsert.length} new cats.` });
    }


    return res.status(400).send('Invalid action requested.');
}

export default handler;