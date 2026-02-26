export const prerender = false;

import type { APIRoute } from 'astro';
import { db, Event, Reservation, eq, sql } from 'astro:db';

export const GET: APIRoute = async ({ params, cookies }) => {
  const session = cookies.get('admin-session');
  if (!session || session.value !== 'authenticated') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { id } = params;
  const [event] = await db.select().from(Event).where(eq(Event.id, id!));

  if (!event) {
    return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404 });
  }

  const reservations = await db
    .select()
    .from(Reservation)
    .where(eq(Reservation.eventId, id!))
    .orderBy(Reservation.createdAt);

  const [{ totalPairs }] = await db
    .select({ totalPairs: sql<number>`COALESCE(SUM(${Reservation.numberOfPairs}), 0)` })
    .from(Reservation)
    .where(eq(Reservation.eventId, id!));

  return new Response(
    JSON.stringify({
      event: { ...event, reservedPairs: totalPairs, remainingCapacity: event.capacity - totalPairs },
      reservations,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  const session = cookies.get('admin-session');
  if (!session || session.value !== 'authenticated') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { id } = params;
  const body = await request.json();

  await db.update(Event).set(body).where(eq(Event.id, id!));

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const session = cookies.get('admin-session');
  if (!session || session.value !== 'authenticated') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { id } = params;
  await db.delete(Reservation).where(eq(Reservation.eventId, id!));
  await db.delete(Event).where(eq(Event.id, id!));

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
