import { Complaint, ComplaintVote } from '../models/Complaint.ts';
import { emailService } from './emailService.ts';
import { rewardsService } from './rewardsService.ts';

const OLLAMA_URL = 'http://localhost:11434/api/generate';

export const duplicateService = {
  checkDuplicates: async (newDescription: string, category: string): Promise<any> => {
    // 1. Fetch complaints from same category in past 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recent = await Complaint.find({
      category,
      createdAt: { $gte: weekAgo }
    }).select('_id description status vote_count').lean();

    if (recent.length === 0) return { isDuplicate: false };

    // 2. Prepare context for Llama (keeping the logic as is)
    const prompt = `
      Identify if the "New Complaint" is semantically similar to any of the "Existing Complaints" (Similarity > 80%).
      
      New Complaint: "${newDescription}"
      
      Existing Complaints:
      ${recent.map(c => `- [ID: ${c._id}] ${c.description}`).join('\n')}
      
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
    const existing = await ComplaintVote.findOne({ complaint_id: complaintId, citizen_email: email });
    
    if (existing) return { success: false, message: 'Already voted' };

    await ComplaintVote.create({
      complaint_id: complaintId,
      citizen_email: email
    });
    
    const complaint = await Complaint.findOneAndUpdate(
      { _id: complaintId },
      { $inc: { vote_count: 1 } },
      { new: true }
    );
    
    if (!complaint) return { success: false, message: 'Complaint not found' };
    
    // RAWARDS: 3+ votes bonus
    if (complaint.vote_count === 3 && complaint.citizen_id) {
        await rewardsService.awardPoints(complaint.citizen_id.toString(), 15, 'Community Interest (3+ Votes)', complaintId);
    }

    // Check for escalation (threshold 5)
    if (complaint.vote_count >= 5 && complaint.priority !== 'High' && complaint.priority !== 'Urgent') {
       complaint.priority = 'High';
       complaint.is_cluster_head = true;
       await complaint.save();
       
       // Notify admin
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
