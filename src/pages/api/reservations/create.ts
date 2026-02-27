export const prerender = false;

import type { APIRoute } from 'astro';
import { db, Reservation, Event, eq, sql } from 'astro:db';
import { nanoid } from 'nanoid';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { eventId, name, email, phone, numberOfPairs, message } = body;

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

    // Get event
    const [event] = await db.select().from(Event).where(eq(Event.id, eventId));
    if (!event) {
      return new Response(
        JSON.stringify({ error: 'Dogodek ne obstaja.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check capacity
    const [{ totalPairs }] = await db
      .select({ totalPairs: sql<number>`COALESCE(SUM(${Reservation.numberOfPairs}), 0)` })
      .from(Reservation)
      .where(eq(Reservation.eventId, eventId));

    const remaining = event.capacity - totalPairs;
    if (numberOfPairs > remaining) {
      return new Response(
        JSON.stringify({ error: `Na voljo je samo še ${remaining} mest.` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create reservation
    const reservationId = nanoid();
    await db.insert(Reservation).values({
      id: reservationId,
      eventId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      numberOfPairs: Number(numberOfPairs),
      message: message?.trim() || null,
      status: 'confirmed',
      createdAt: new Date(),
    });

    // Try to send email (non-blocking)
    try {
      const { sendConfirmationEmail } = await import('../../../lib/email');
      await sendConfirmationEmail({ email, name, event, numberOfPairs, reservationId });
    } catch (emailErr) {
      console.error('Email sending failed (non-critical):', emailErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Rezervacija uspešna! Potrditev bo poslana na vaš e-poštni naslov.',
        reservationId,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Reservation error:', message, error);
    return new Response(
      JSON.stringify({ error: `Napaka: ${message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
