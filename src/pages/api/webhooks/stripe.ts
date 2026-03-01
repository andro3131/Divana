export const prerender = false;

import type { APIRoute } from 'astro';
import { db, Reservation, Event, eq } from 'astro:db';
import { getStripe } from '../../../lib/stripe';

export const POST: APIRoute = async ({ request }) => {
  const stripe = getStripe();
  const sig = request.headers.get('stripe-signature');
  const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return new Response('Missing signature or webhook secret', { status: 400 });
  }

  let event;
  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const reservationId = session.metadata?.reservationId;

      if (!reservationId) {
        console.error('No reservationId in session metadata');
        break;
      }

      await db
        .update(Reservation)
        .set({
          status: 'confirmed',
          paymentStatus: 'paid',
          stripeSessionId: session.id,
        })
        .where(eq(Reservation.id, reservationId));

      // Send confirmation email
      try {
        const [reservation] = await db
          .select()
          .from(Reservation)
          .where(eq(Reservation.id, reservationId));

        if (reservation) {
          const [eventData] = await db
            .select()
            .from(Event)
            .where(eq(Event.id, reservation.eventId));

          if (eventData) {
            // Get receipt URL from Stripe charge
            let receiptUrl: string | undefined;
            try {
              if (session.payment_intent) {
                const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
                if (paymentIntent.latest_charge) {
                  const charge = await stripe.charges.retrieve(paymentIntent.latest_charge as string);
                  receiptUrl = charge.receipt_url ?? undefined;
                }
              }
            } catch (e) {
              console.error('Failed to get receipt URL:', e);
            }

            const { sendConfirmationEmail, sendReservationNotification } = await import('../../../lib/email');
            const emailData = {
              email: reservation.email,
              name: reservation.name,
              event: eventData,
              numberOfPairs: reservation.numberOfPairs,
              reservationId,
              isPaid: true,
              receiptUrl,
            };
            await Promise.all([
              sendConfirmationEmail(emailData),
              sendReservationNotification(emailData),
            ]);
          }
        }
      } catch (emailErr) {
        console.error('Email sending failed (non-critical):', emailErr);
      }

      break;
    }

    case 'checkout.session.expired': {
      const session = event.data.object;
      const reservationId = session.metadata?.reservationId;

      if (reservationId) {
        await db
          .update(Reservation)
          .set({
            status: 'expired',
            paymentStatus: 'expired',
          })
          .where(eq(Reservation.id, reservationId));
      }

      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
