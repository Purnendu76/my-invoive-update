import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();


// Get absolute path to uploads directory (ESM safe)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "../uploads");

// GET /api/v1/files/:filename
router.get("/:filename", (req, res) => {
	const { filename } = req.params;
	const filePath = path.join(uploadsDir, filename);
	res.sendFile(filePath, err => {
		if (err) {
			res.status(404).json({ error: "File not found" });
		}
	});
});

export default router;
