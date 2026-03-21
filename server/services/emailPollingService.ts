import { ImapFlow } from 'imapflow';
import { complaintService } from './complaintService.ts';
import { aiService } from './aiService.ts';
import { emailService } from './emailService.ts';

let started = false;

export const emailPollingService = {
  start: () => {
    if (started) return;
    started = true;
    setInterval(async () => {
      const host = process.env.IMAP_HOST;
      const user = process.env.IMAP_USER;
      const pass = process.env.IMAP_PASS;
      if (!host || !user || !pass) return;
      const client = new ImapFlow({ host, port: Number(process.env.IMAP_PORT || 993), secure: true, auth: { user, pass } });
      try {
        await client.connect();
        const lock = await client.getMailboxLock('INBOX');
        try {
          for await (const msg of client.fetch('1:*', { envelope: true, source: true, flags: true })) {
            if (msg.flags?.has('\\Seen')) continue;
            const from = msg.envelope?.from?.[0]?.address || '';
            const body = msg.source?.toString() || '';
            const parsed = await aiService.parseIncomingMessage(body, from);
            const complaint = await complaintService.create({
              citizenName: from.split('@')[0] || 'Email Citizen',
              contactInfo: from,
              category: parsed.category,
              description: parsed.description,
              priority: parsed.priority,
              department: 'Unassigned',
              source: 'email'
            });
            if (from) emailService.sendTrackingCodeEmail(from, complaint.id, complaint.category);
            await client.messageFlagsAdd(msg.seq, ['\\Seen']);
          }
        } finally {
          lock.release();
        }
      } catch (err) {
        console.error('Email polling error', err);
      } finally {
        await client.logout().catch(() => {});
      }
    }, 5 * 60 * 1000);
  }
};
