import express from 'express';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const multerLib = require('multer');
const multer = multerLib.default || multerLib;
const pdf = require('pdf-parse');
import { logger } from '../../utils/logger.js';
import { getDatabase } from '../../database/init-db.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const db = () => getDatabase();

/**
 * Heuristic to extract items from invoice text
 * This is an advanced AI-like heuristic that looks for common patterns in invoice tables.
 */
function extractItemsFromText(text) {
    const lines = text.split('\n');
    const items = [];

    // Pattern common for rows: [Quantity] [UM] [Price] [Value]
    // Often row looks like: "1 100 Faina 1.00 Kg 5.00 0.45 5.45"
    // Or "Faina alba 1.00 Kg 5.00"

    // We look for lines that contain numbers and common UM patterns
    const umPatterns = ['kg', 'buc', 'litri', 'l', 'gr', 'st.', 'ml', 'g'];

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        // Simple heuristic: Line must have at least one numeric value (price or qty)
        const numbers = line.match(/\d+([.,]\d+)?/g);
        if (!numbers || numbers.length < 2) continue;

        // Try to find if line contains a UM
        const foundUM = umPatterns.find(um => new RegExp(`\\b${um}\\b`, 'i').test(line));

        if (foundUM || (numbers.length >= 3)) {
            // Potential item line
            // Let's try to extract name (everything before the first number or around numbers)
            // This is a naive implementation, in a real app would use better OCR or structural analysis
            items.push({
                raw: line,
                suggested_name: line.replace(/[0-9.,]/g, '').replace(/\b(kg|buc|g|l|ml)\b/gi, '').trim(),
                suggested_qty: numbers[0],
                suggested_price: numbers[numbers.length - 2] || numbers[1]
            });
        }
    }

    return items;
}

router.post('/parse-pdf', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Niciun fișier încărcat.' });
        }

        const dataBuffer = req.file.buffer;
        const data = await pdf(dataBuffer);

        // Extract raw text
        const text = data.text;
        logger.info(`PDF parsed: ${req.file.originalname}, length: ${text.length}`);

        // Try to extract structured items
        const suggestions = extractItemsFromText(text);

        res.json({
            success: true,
            filename: req.file.originalname,
            text_preview: text.substring(0, 500),
            items: suggestions
        });

    } catch (error) {
        logger.error('PDF Parse error:', error);
        res.status(500).json({ error: 'Eroare la procesarea PDF: ' + error.message });
    }
});

export default router;
