export const prerender = false;

import type { APIRoute } from 'astro';
import { db, Event, Reservation, eq, sql, gte } from 'astro:db';

export const GET: APIRoute = async () => {
  const events = await db
    .select({
      id: Event.id,
      titleSl: Event.titleSl,
      titleEn: Event.titleEn,
      descriptionSl: Event.descriptionSl,
      descriptionEn: Event.descriptionEn,
      date: Event.date,
      location: Event.location,
      price: Event.price,
      capacity: Event.capacity,
      imageUrl: Event.imageUrl,
    })
    .from(Event)
    .where(eq(Event.isPublished, true))
    .orderBy(Event.date);

  // Filter to upcoming events in JS (gte on dates can be tricky in some DB drivers)
  const now = new Date();
  const upcoming = events.filter((e) => new Date(e.date) >= now);

  // Get reservation counts for each event
  const result = await Promise.all(
    upcoming.map(async (event) => {
      const [{ totalPairs }] = await db
        .select({
          totalPairs: sql<number>`COALESCE(SUM(${Reservation.numberOfPairs}), 0)`,
        })
        .from(Reservation)
        .where(eq(Reservation.eventId, event.id));

      return {
        ...event,
        reservedPairs: totalPairs,
        remainingCapacity: event.capacity - totalPairs,
      };
    })
  );

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
};
