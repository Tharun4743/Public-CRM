import db from '../db/database.ts';

const BADGE_RULES = [
  { id: 'first_step', name: '🌱 First Step', description: 'Submitted first complaint', condition: (c: any) => c.total_complaints >= 1 },
  { id: 'active_citizen', name: '🔥 Active Citizen', description: 'Submitted 5 complaints', condition: (c: any) => c.total_complaints >= 5 },
  { id: 'community_champion', name: '💪 Community Champion', description: 'Submitted 10 complaints', condition: (c: any) => c.total_complaints >= 10 },
  { id: 'feedback_hero', name: '⭐ Feedback Hero', description: 'Submitted feedback 5 times', condition: (c: any) => c.feedback_count >= 5 }, // I'll need to count feedback
  { id: 'evidence_expert', name: '📸 Evidence Expert', description: 'Uploaded photos on 5 complaints', condition: (c: any) => c.evidence_count >= 5 }, // I'll need to count photos
  { id: 'top_reporter', name: '🏆 Top Reporter', description: '500+ total points', condition: (c: any) => c.total_points >= 500 },
];

export const rewardsService = {
  awardPoints: async (citizenId: number, points: number, reason: string, complaintId?: string) => {
    if (!citizenId) return;

    try {
      const id = `PH-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const now = new Date().toISOString();

      // Save points history
      db.prepare(`
        INSERT INTO points_history (id, citizen_id, points, reason, complaint_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, citizenId, points, reason, complaintId || null, now);

      // Update total points
      db.prepare(`
        UPDATE citizens SET total_points = total_points + ? WHERE id = ?
      `).run(points, citizenId);

      // Update total_complaints if this is a new sub
      if (reason === 'Submit complaint') {
          db.prepare('UPDATE citizens SET total_complaints = total_complaints + 1 WHERE id = ?').run(citizenId);
      }

      await rewardsService.checkAndAwardBadges(citizenId);
    } catch (error) {
      console.error('Error awarding points:', error);
    }
  },

  checkAndAwardBadges: async (citizenId: number) => {
    const citizen = db.prepare('SELECT * FROM citizens WHERE id = ?').get(citizenId) as any;
    if (!citizen) return;

    const currentBadges = JSON.parse(citizen.badges || '[]');
    const stats: any = {
      total_complaints: citizen.total_complaints,
      total_points: citizen.total_points,
      feedback_count: (db.prepare(`
        SELECT COUNT(*) as count FROM complaints 
        WHERE citizen_id = ? AND feedback_submitted = 1
      `).get(citizenId) as any).count,
      evidence_count: (db.prepare(`
        SELECT COUNT(*) as count FROM complaints 
        WHERE citizen_id = ? AND complaint_image IS NOT NULL
      `).get(citizenId) as any).count
    };

    const newBadges = [...currentBadges];
    let awarded = false;

    for (const rule of BADGE_RULES) {
      if (!currentBadges.includes(rule.id) && rule.condition(stats)) {
        newBadges.push(rule.id);
        awarded = true;
      }
    }

    if (awarded) {
      db.prepare('UPDATE citizens SET badges = ? WHERE id = ?')
        .run(JSON.stringify(newBadges), citizenId);
    }
  },

  getVoucherTypes: async () => {
    return db.prepare('SELECT * FROM voucher_types WHERE is_active = 1').all();
  },

  redeemVoucher: async (citizenId: number, voucherTypeId: string) => {
    const voucherType = db.prepare('SELECT * FROM voucher_types WHERE id = ? AND is_active = 1').get(voucherTypeId) as any;
    if (!voucherType) throw new Error('Voucher type not found or inactive');

    const citizen = db.prepare('SELECT total_points, email FROM citizens WHERE id = ?').get(citizenId) as any;
    if (!citizen || citizen.total_points < voucherType.points_required) {
      throw new Error('Insufficient points');
    }

    if (voucherType.total_available <= 0) {
      throw new Error('Voucher out of stock');
    }

    const voucherId = `VOU-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const code = `REWARD-${Math.random().toString(36).substr(2, 6).toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const now = new Date();
    const expiry = new Date(now);
    expiry.setDate(now.getDate() + 30);

    const tx = db.transaction(() => {
      // Deduct points
      db.prepare('UPDATE citizens SET total_points = total_points - ? WHERE id = ?')
        .run(voucherType.points_required, citizenId);

      // Save voucher
      db.prepare(`
        INSERT INTO vouchers (id, citizen_id, code, title, description, points_required, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(voucherId, citizenId, code, voucherType.title, voucherType.description, voucherType.points_required, expiry.toISOString(), now.toISOString());

      // Reduce availability
      db.prepare('UPDATE voucher_types SET total_available = total_available - 1 WHERE id = ?')
        .run(voucherTypeId);
    });

    tx();

    // Send email via emailService
    return { code, title: voucherType.title, email: citizen.email };
  }
};
