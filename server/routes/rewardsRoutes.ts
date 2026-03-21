import express from 'express';
import { rewardsController } from '../controllers/rewardsController.ts';
import { requireCitizenAuth } from '../middleware/auth.ts';

const router = express.Router();

router.get('/summary', requireCitizenAuth, rewardsController.getSummary);
router.get('/history', requireCitizenAuth, rewardsController.getHistory);
router.get('/vouchers/available', requireCitizenAuth, rewardsController.getAvailableVouchers);
router.post('/vouchers/redeem', requireCitizenAuth, rewardsController.redeemVoucher);
router.get('/vouchers/my', requireCitizenAuth, rewardsController.getMyVouchers);
router.get('/leaderboard', rewardsController.getLeaderboard);

// Admin
router.post('/vouchers/types', requireCitizenAuth, rewardsController.createVoucherType);
router.get('/vouchers/redeemed', requireCitizenAuth, rewardsController.getAllRedeemedVouchers);

export default router;
