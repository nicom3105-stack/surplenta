import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const COMMISSION = 0.05;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { listing, quantity, buyerEmail, buyerId, buyerName } = req.body;
    if (!listing || !quantity) return res.status(400).json({ error: 'Faltan datos' });

    const totalCents = Math.round(listing.price * quantity * 100);
    const commissionCents = Math.round(totalCents * COMMISSION);
    const payoutCents = totalCents - commissionCents;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'usd',
      receipt_email: buyerEmail || undefined,
      metadata: {
        listing_id: listing.id,
        listing_title: listing.title,
        buyer_id: buyerId || '',
        buyer_email: buyerEmail || '',
        buyer_name: buyerName || '',
        seller_id: listing.seller_id || '',
        seller_name: listing.seller_name || '',
        quantity: quantity.toString(),
        unit_price: listing.price.toString(),
        total_amount: (totalCents / 100).toString(),
        commission: (commissionCents / 100).toString(),
        seller_payout: (payoutCents / 100).toString(),
      },
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message });
  }
}
