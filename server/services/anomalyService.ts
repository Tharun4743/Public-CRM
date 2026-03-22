import { Complaint } from '../models/Complaint.ts';
import { AnomalyAlert } from '../models/System.ts';
import { notificationService } from './notificationService.ts';

export const anomalyService = {
  detectAnomalies: async () => {
    console.log('[ANOMALY] Starting predictive detection scan...');
    
    // Group counts for past 24h
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const currentCounts = await Complaint.aggregate([
      { $match: { createdAt: { $gte: yesterday } } },
      { $group: { _id: { category: "$category", area: "$department" }, count: { $sum: 1 } } }
    ]);

    // Group counts for past 7 days (average per day)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const historyCounts = await Complaint.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo, $lt: yesterday } } },
      { $group: { _id: { category: "$category", area: "$department" }, count: { $sum: 1 } } },
      { $project: { _id: 1, avg_count: { $divide: ["$count", 6] } } } // 6 days in the period
    ]);

    for (const curr of currentCounts) {
       const hist = historyCounts.find(h => h._id.category === curr._id.category && h._id.area === curr._id.area);
       const avg = hist ? hist.avg_count : 0.5;

       if (curr.count > 2 && curr.count > (avg * 3)) {
          const magnitude = `${(curr.count / avg).toFixed(1)}x over average`;
          await anomalyService.consultAI(curr._id.category, curr._id.area, curr.count, avg, magnitude);
       }
    }
  },

  consultAI: async (category: string, area: string, count: number, avg: number, magnitude: string) => {
    try {
      const prompt = `Analyze this pattern in a city CRM:
      Category: ${category}
      Department/Area: ${area}
      New Complaints (last 24h): ${count}
      Normal Daily Average (7d): ${avg.toFixed(1)}
      Magnitude: ${magnitude}
      
      Is this a statistically significant anomaly indicative of a infrastructure failure? 
      Return JSON only: { isAnomaly: boolean, suggestion: string, confidence: number }`;

      const response = await fetch("http://localhost:11434/api/generate", {
          method: "POST",
          body: JSON.stringify({ model: "llama3", prompt, stream: false })
      });
      const data = await response.json();
      const aiResponse = JSON.parse(data.response.match(/\{.*\}/s)[0]);

      if (aiResponse.isAnomaly) {
         await AnomalyAlert.create({
           category,
           area,
           spike_magnitude: magnitude,
           ai_suggestion: aiResponse.suggestion
         });

         await notificationService.create(null, null, 'alert', `CRITICAL ANOMALY: ${category} spike detected in ${area}. AI suggests: ${aiResponse.suggestion}`);
      }
    } catch (err) {
      console.error('AI Anomaly Validation Error:', err);
    }
  },

  getActiveAlerts: async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return await AnomalyAlert.find({
      is_acknowledged: false,
      detected_at: { $gte: yesterday }
    }).sort({ detected_at: -1 }).lean();
  },

  acknowledgeAlert: async (id: string, adminId: string) => {
    await AnomalyAlert.findByIdAndUpdate(id, {
      is_acknowledged: true,
      acknowledged_by: adminId,
      acknowledged_at: new Date()
    });
  }
};
