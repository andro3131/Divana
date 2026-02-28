export const prerender = false;

import type { APIRoute } from 'astro';
import { db, Reservation, Event, eq, sql } from 'astro:db';
import { nanoid } from 'nanoid';
import { getStripe } from '../../../lib/stripe';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { eventId, name, email, phone, numberOfPairs, message, locale } = body;

    if (!eventId || !name || !email || !phone || !numberOfPairs) {
      return new Response(
        JSON.stringify({ error: 'Vsa obvezna polja morajo biti izpolnjena.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (numberOfPairs < 1 || numberOfPairs > 10) {
      return new Response(
        JSON.stringify({ error: 'Neveljavno število parov.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const [event] = await db.select().from(Event).where(eq(Event.id, eventId));
    if (!event || !event.onlinePrice) {
      return new Response(
        JSON.stringify({ error: 'Dogodek ne obstaja ali nima online cene.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check capacity (exclude expired reservations)
    const [{ totalPairs }] = await db
      .select({ totalPairs: sql<number>`COALESCE(SUM(${Reservation.numberOfPairs}), 0)` })
      .from(Reservation)
      .where(sql`${Reservation.eventId} = ${eventId} AND ${Reservation.status} != 'expired'`);

    const remaining = event.capacity - totalPairs;
    if (numberOfPairs > remaining) {
      return new Response(
        JSON.stringify({ error: `Na voljo je samo še ${remaining} mest.` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create pending reservation
    const reservationId = nanoid();
    await db.insert(Reservation).values({
      id: reservationId,
      eventId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      numberOfPairs: Number(numberOfPairs),
      message: message?.trim() || null,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date(),
    });

    // Build URLs
    const baseUrl = import.meta.env.SITE || 'https://divana.si';
    const successPath = locale === 'en' ? '/en/payment/success' : '/placilo/uspeh';
    const cancelPath = locale === 'en' ? '/en/payment/cancelled' : '/placilo/preklicano';

    // Create Stripe Checkout Session
    const stripe = getStripe();
    const eventTitle = locale === 'en' && event.titleEn ? event.titleEn : event.titleSl;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email.trim().toLowerCase(),
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: eventTitle,
              description: `${numberOfPairs} ${numberOfPairs === 1 ? 'par' : 'parov'} – ${event.location}`,
            },
            unit_amount: event.onlinePrice,
          },
          quantity: numberOfPairs,
        },
      ],
      metadata: {
        reservationId,
        eventId,
        numberOfPairs: String(numberOfPairs),
      },
      success_url: `${baseUrl}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}${cancelPath}?reservation_id=${reservationId}`,
      locale: locale === 'sl' ? 'sl' : 'en',
    });

    // Store stripe session ID
    await db
      .update(Reservation)
      .set({ stripeSessionId: session.id })
      .where(eq(Reservation.id, reservationId));

    return new Response(
      JSON.stringify({ url: session.url, reservationId }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Checkout session error:', message, error);
    return new Response(
      JSON.stringify({ error: `Napaka: ${message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
