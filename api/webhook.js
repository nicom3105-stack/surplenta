import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    const rawBody = await getRawBody(req);
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else {
      event = JSON.parse(rawBody.toString());
    }
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const m = session.metadata;

    await supabase.from('orders').upsert({
      stripe_session_id: session.id,
      listing_id: m.listing_id || null,
      listing_title: m.listing_title,
      buyer_id: m.buyer_id || null,
      buyer_email: m.buyer_email,
      buyer_name: m.buyer_name,
      seller_id: m.seller_id || null,
      seller_name: m.seller_name,
      quantity: parseInt(m.quantity),
      unit_price: parseFloat(m.unit_price),
      total_amount: parseFloat(m.total_amount),
      commission: parseFloat(m.commission),
      seller_payout: parseFloat(m.seller_payout),
      status: 'paid',
    }, { onConflict: 'stripe_session_id' });
  }

  res.status(200).json({ received: true });
}
