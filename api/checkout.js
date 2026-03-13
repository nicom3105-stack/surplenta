import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const COMMISSION = 0.05;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { listing, quantity, buyerEmail, buyerId, buyerName } = req.body;
    if (!listing || !quantity) return res.status(400).json({ error: 'Faltan datos' });

    const unitAmount = Math.round(listing.price * 100);
    const totalAmount = unitAmount * quantity;
    const commissionAmount = Math.round(totalAmount * COMMISSION);
    const payoutAmount = totalAmount - commissionAmount;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: buyerEmail || undefined,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: listing.title,
            description: `Vendedor: ${listing.seller_name} · ${listing.location}`,
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
        buyer_id: buyerId || '',
        buyer_email: buyerEmail || '',
        buyer_name: buyerName || '',
        seller_id: listing.seller_id || '',
        seller_name: listing.seller_name || '',
        quantity: quantity.toString(),
        unit_price: listing.price.toString(),
        total_amount: (totalAmount / 100).toString(),
        commission: (commissionAmount / 100).toString(),
        seller_payout: (payoutAmount / 100).toString(),
      },
    });

    res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message });
  }
}
