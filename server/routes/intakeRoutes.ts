import { Router } from 'express';
import twilio from 'twilio';
import { aiService } from '../services/aiService.ts';
import { complaintService } from '../services/complaintService.ts';

const router = Router();

router.post('/whatsapp', async (req, res) => {
  try {
    const body = req.body.Body || req.body.body || '';
    const from = req.body.From || req.body.from || '';
    const parsed = await aiService.parseIncomingMessage(body, from);
    const complaint = await complaintService.create({
      citizenName: from || 'WhatsApp Citizen',
      contactInfo: from || 'whatsapp',
      category: parsed.category,
      description: parsed.description,
      priority: parsed.priority,
      department: 'Unassigned',
      source: 'whatsapp',
      citizen_phone: from
    });

    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM && from) {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: from,
        body: `PS-CRM: Complaint registered. Tracking ID: ${complaint._id}. Expected SLA: ${complaint.sla_deadline || 'Standard window'}.`
      });
    }

    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(`Complaint received. Tracking ID: ${complaint._id}`);
    res.type('text/xml').send(twiml.toString());
  } catch (e) {
    res.status(500).json({ message: 'intake failed' });
  }
});

export default router;
