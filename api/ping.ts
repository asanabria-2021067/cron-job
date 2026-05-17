import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runManualPing } from '../src/index';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Optional: Simple security header authorization using Vercel Cron secrets
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const success = await runManualPing();
  if (success) {
    return res.status(200).json({
      success: true,
      message: 'All Supabase instances kept alive successfully!',
      timestamp: new Date().toISOString(),
    });
  } else {
    return res.status(500).json({
      success: false,
      error: 'One or more keep-alive database connections failed. Check logs.',
      timestamp: new Date().toISOString(),
    });
  }
}
