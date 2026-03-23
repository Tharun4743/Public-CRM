import express from 'express';
import { dbStatsController } from '../controllers/dbStatsController.ts';

const router = express.Router();

// Protected by a simple admin key header check
router.get('/', (req, res, next) => {
  const key = req.headers['x-admin-key'];
  if (!process.env.ADMIN_DB_KEY || key !== process.env.ADMIN_DB_KEY) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}, dbStatsController.getStats);

export default router;
