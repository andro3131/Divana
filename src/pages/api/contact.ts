export const prerender = false;

import type { APIRoute } from 'astro';
import { db, ContactMessage } from 'astro:db';
import { nanoid } from 'nanoid';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: 'Vsa polja so obvezna.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await db.insert(ContactMessage).values({
      id: nanoid(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      createdAt: new Date(),
    });

    // Try to send notification email (non-blocking)
    try {
      const { sendContactNotification } = await import('../../lib/email');
      await sendContactNotification({ name, email, message });
    } catch (emailErr) {
      console.error('Email notification failed (non-critical):', emailErr);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return new Response(
      JSON.stringify({ error: 'Napaka pri pošiljanju.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
