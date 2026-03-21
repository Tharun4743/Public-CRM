import db from '../db/database.ts';
import { emailService } from './emailService.ts';
import { rewardsService } from './rewardsService.ts';

const OLLAMA_URL = 'http://localhost:11434/api/generate';

export const duplicateService = {
  checkDuplicates: async (newDescription: string, category: string): Promise<any> => {
    // 1. Fetch complaints from same category in past 7 days
    const recent = db.prepare(`
      SELECT id, description, status, vote_count 
      FROM complaints 
      WHERE category = ? 
      AND julianday('now') - julianday(createdAt) <= 7
    `).all(category) as any[];

    if (recent.length === 0) return { isDuplicate: false };

    // 2. Prepare context for Llama
    const prompt = `
      Identify if the "New Complaint" is semantically similar to any of the "Existing Complaints" (Similarity > 80%).
      
      New Complaint: "${newDescription}"
      
      Existing Complaints:
      ${recent.map(c => `- [ID: ${c.id}] ${c.description}`).join('\n')}
      
      Return ONLY a JSON response in this format:
      {
        "isDuplicate": boolean,
        "matchedId": "ID of the matched complaint or null",
        "score": 0.0 to 1.0 similarity score,
        "summary": "short summary of existing complaint"
      }
    `;

    try {
      const response = await fetch(OLLAMA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3',
          prompt,
          stream: false,
          format: 'json'
        })
      });

      const data = await response.json();
      const result = JSON.parse(data.response);
      
      if (result.isDuplicate && result.score >= 0.8) {
        return result;
      }
    } catch (err) {
      console.error('Ollama duplicate check failed:', err);
    }

    return { isDuplicate: false };
  },

  addMyVote: async (complaintId: string, email: string) => {
    // Check if voter already voted
    const existing = db.prepare('SELECT 1 FROM complaint_votes WHERE complaint_id = ? AND citizen_email = ?')
      .get(complaintId, email);
    
    if (existing) return { success: false, message: 'Already voted' };

    const voteId = `VT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const now = new Date().toISOString();
    
    db.prepare('INSERT INTO complaint_votes (id, complaint_id, citizen_email, voted_at) VALUES (?, ?, ?, ?)')
      .run(voteId, complaintId, email, now);
    
    db.prepare('UPDATE complaints SET vote_count = vote_count + 1 WHERE id = ?').run(complaintId);
    
    const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaintId) as any;
    
    // RAWARDS: 3+ votes bonus
    if (complaint.vote_count === 3 && complaint.citizen_id) {
        await rewardsService.awardPoints(complaint.citizen_id, 15, 'Community Interest (3+ Votes)', complaintId);
    }

    // Check for escalation (threshold 5)
    if (complaint.vote_count >= 5 && complaint.priority !== 'High' && complaint.priority !== 'Urgent') {
       db.prepare('UPDATE complaints SET priority = ?, is_cluster_head = 1 WHERE id = ?').run('High', complaintId);
       
       // Notify admin via existing email system
       const adminEmail = process.env.ADMIN_EMAIL || 'admin@ps-crm.gov';
       emailService.sendEscalationEmail(
         adminEmail, 
         complaintId, 
         1, 
         `Community Cluster Alert: This complaint has received ${complaint.vote_count} votes from different citizens. Automatically escalated to High Priority.`
       );
    }

    return { success: true, vote_count: complaint.vote_count };
  }
};
