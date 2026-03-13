import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const COMMISSION = 0.05;
const TAX = 0.07; // ITBMS Panama

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { listing, quantity, buyerEmail, buyerId, buyerName } = req.body;
    if (!listing || !quantity) return res.status(400).json({ error: 'Faltan datos' });

    const subtotal = listing.price * quantity;
    const tax = subtotal * TAX;
    const total = subtotal + tax; // buyer pays subtotal + ITBMS
    const commission = subtotal * COMMISSION; // commission from seller's cut
    const sellerPayout = subtotal - commission; // seller gets subtotal minus commission
    const totalCents = Math.round(total * 100);

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
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total_amount: total.toFixed(2),
        commission: commission.toFixed(2),
        seller_payout: sellerPayout.toFixed(2),
      },
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message });
  }
}
