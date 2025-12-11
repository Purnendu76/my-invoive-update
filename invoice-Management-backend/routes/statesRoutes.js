
import express from 'express';
import { db } from '../db/index.js';
import { states } from '../db/schema.js';
const router = express.Router();

// GET /api/v1/states - list all states
router.get('/', async (req, res) => {
	try {
		const allStates = await db.select().from(states);
		res.json(allStates);
	} catch (err) {
		console.error('Error fetching states:', err);
		res.status(500).json({ error: 'Failed to fetch states' });
	}
});

export default router;
