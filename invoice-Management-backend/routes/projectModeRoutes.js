
import express from 'express';
import { db } from '../db/index.js';
import { project_modes } from '../db/schema.js';
const router = express.Router();

// GET /api/v1/project-modes - list all project modes
router.get('/', async (req, res) => {
	try {
		const modes = await db.select().from(project_modes);
		res.json(modes);
	} catch (err) {
		console.error('Error fetching project modes:', err);
		res.status(500).json({ error: 'Failed to fetch project modes' });
	}
});

export default router;
