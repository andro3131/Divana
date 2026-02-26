export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, cookies }) => {
  const body = await request.json();
  const { password } = body;

  if (password === import.meta.env.ADMIN_PASSWORD) {
    cookies.set('admin-session', 'authenticated', {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    });
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Napačno geslo' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
};
