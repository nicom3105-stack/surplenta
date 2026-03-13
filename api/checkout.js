import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const COMMISSION = 0.05;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { listing, quantity, buyerEmail } = req.body;
    if (!listing || !quantity) return res.status(400).json({ error: 'Faltan datos' });

    const unitAmount = Math.round(listing.price * 100);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: buyerEmail || undefined,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: listing.title,
            description: `${listing.seller_name} · ${listing.location}`,
          },
          unit_amount: unitAmount,
        },
        quantity,
      }],
      mode: 'payment',
      success_url: `${req.headers.origin}?payment=success&listing=${listing.id}`,
      cancel_url: `${req.headers.origin}?payment=cancelled`,
      metadata: {
        listing_id: listing.id,
        listing_title: listing.title,
        seller_name: listing.seller_name || '',
        commission: Math.round(unitAmount * quantity * COMMISSION).toString(),
        quantity: quantity.toString(),
      },
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message });
  }
}
