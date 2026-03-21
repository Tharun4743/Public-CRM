import db from '../db/database.ts';
import { v4 as uuidv4 } from 'uuid';
import { notificationService } from './notificationService.ts';

export const anomalyService = {
  detectAnomalies: async () => {
    console.log('[ANOMALY] Starting predictive detection scan...');
    
    // Group counts for past 24h
    const currentCounts = db.prepare(`
      SELECT category, department as area, COUNT(*) as count 
      FROM complaints 
      WHERE createdAt >= datetime('now', '-1 day')
      GROUP BY category, area
    `).all() as any[];

    // Group counts for past 7 days (average per day)
    const historyCounts = db.prepare(`
       SELECT category, department as area, COUNT(*) / 7.0 as avg_count
       FROM complaints 
       WHERE createdAt >= datetime('now', '-7 days') AND createdAt < datetime('now', '-1 day')
       GROUP BY category, area
    `).all() as any[];

    for (const curr of currentCounts) {
       const hist = historyCounts.find(h => h.category === curr.category && h.area === curr.area);
       const avg = hist ? hist.avg_count : 0.5; // handle cases where there was no history

       // Trigger AI scan if count > 2 and count > (avg * 3) 
       if (curr.count > 2 && curr.count > (avg * 3)) {
          console.log(`[ANOMALY] Potential spike detected in ${curr.category} at ${curr.area}. Current: ${curr.count}, Avg: ${avg}. Validating via AI...`);
          
          const magnitude = `${(curr.count / avg).toFixed(1)}x over average`;
          await anomalyService.consultAI(curr.category, curr.area, curr.count, avg, magnitude);
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
         const id = `ALRT-${uuidv4().substring(0, 8).toUpperCase()}`;
         db.prepare(`
           INSERT INTO anomaly_alerts (id, detected_at, category, area, spike_magnitude, ai_suggestion)
           VALUES (?, ?, ?, ?, ?, ?)
         `).run(id, new Date().toISOString(), category, area, magnitude, aiResponse.suggestion);

         await notificationService.create(null, null, 'alert', `CRITICAL ANOMALY: ${category} spike detected in ${area}. AI suggests: ${aiResponse.suggestion}`);
      }
    } catch (err) {
      console.error('AI Anomaly Validation Error:', err);
    }
  },

  getActiveAlerts: async () => {
    // Return all alerts from the last 24h that are not acknowledged
    return db.prepare(`
      SELECT * FROM anomaly_alerts 
      WHERE is_acknowledged = 0 
      AND detected_at >= datetime('now', '-1 day')
      ORDER BY detected_at DESC
    `).all() as any[];
  },

  acknowledgeAlert: async (id: string, adminId: string) => {
    db.prepare(`
      UPDATE anomaly_alerts 
      SET is_acknowledged = 1, acknowledged_by = ?, acknowledged_at = ? 
      WHERE id = ?
    `).run(adminId, new Date().toISOString(), id);
  }
};
