interface ConfirmationEmailData {
  email: string;
  name: string;
  event: { titleSl: string; date: Date; location: string; price: number | null; onlinePrice?: number | null };
  numberOfPairs: number;
  reservationId: string;
  isPaid?: boolean;
}

export async function sendConfirmationEmail(data: ConfirmationEmailData) {
  const apiKey = import.meta.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log('RESEND_API_KEY not set, skipping email');
    return;
  }

  const { Resend } = await import('resend');
  const resend = new Resend(apiKey);

  const { email, name, event, numberOfPairs, reservationId, isPaid } = data;
  const formattedDate = new Intl.DateTimeFormat('sl-SI', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(event.date));

  await resend.emails.send({
    from: 'Divana <onboarding@resend.dev>',
    replyTo: 'carobnizvok@gmail.com',
    to: email,
    subject: `Potrditev rezervacije - ${event.titleSl}`,
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; background: #0a1720; color: #e8eef2; padding: 40px; border-radius: 12px;">
        <h1 style="color: #c9a84c; font-size: 24px; margin-bottom: 24px;">Potrditev rezervacije</h1>
        <p style="margin-bottom: 16px;">Pozdravljeni, ${name}!</p>
        <p style="margin-bottom: 24px;">Vaša rezervacija je potrjena:</p>
        <div style="background: #122736; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <p style="margin: 4px 0;"><strong style="color: #c9a84c;">Dogodek:</strong> ${event.titleSl}</p>
          <p style="margin: 4px 0;"><strong style="color: #c9a84c;">Datum:</strong> ${formattedDate}</p>
          <p style="margin: 4px 0;"><strong style="color: #c9a84c;">Lokacija:</strong> ${event.location}</p>
          <p style="margin: 4px 0;"><strong style="color: #c9a84c;">Število parov:</strong> ${numberOfPairs}</p>
          ${isPaid && event.onlinePrice
            ? `<p style="margin: 4px 0;"><strong style="color: #c9a84c;">Cena:</strong> ${(event.onlinePrice / 100).toFixed(0)}&euro; na par</p>`
            : event.price
              ? `<p style="margin: 4px 0;"><strong style="color: #c9a84c;">Cena:</strong> ${(event.price / 100).toFixed(0)}&euro; na par</p>`
              : ''}
          <p style="margin: 4px 0;"><strong style="color: #c9a84c;">Plačilo:</strong> ${isPaid ? 'Plačano online ✓' : 'Plačilo na kraju'}</p>
          <p style="margin: 4px 0;"><strong style="color: #c9a84c;">ID rezervacije:</strong> ${reservationId}</p>
        </div>
        <p>Veselimo se vašega obiska!</p>
        <p style="margin-top: 24px; color: #7a9cb2;">Lep pozdrav,<br/>Divana - Maja Marinčič</p>
      </div>
    `,
  });
}

export async function sendReservationNotification(data: ConfirmationEmailData) {
  const apiKey = import.meta.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log('RESEND_API_KEY not set, skipping notification email');
    return;
  }

  const { Resend } = await import('resend');
  const resend = new Resend(apiKey);

  const { name, email, event, numberOfPairs, reservationId, isPaid } = data;
  const formattedDate = new Intl.DateTimeFormat('sl-SI', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(event.date));

  const paymentLabel = isPaid ? 'Plačano online' : 'Plačilo na kraju';
  const pricePerPair = isPaid && event.onlinePrice
    ? `${(event.onlinePrice / 100).toFixed(0)}€`
    : event.price
      ? `${(event.price / 100).toFixed(0)}€`
      : '-';

  await resend.emails.send({
    from: 'Divana <onboarding@resend.dev>',
    replyTo: 'carobnizvok@gmail.com',
    to: 'carobnizvok@gmail.com',
    subject: `Nova rezervacija: ${name} (${numberOfPairs} ${numberOfPairs === 1 ? 'par' : 'parov'}) - ${event.titleSl}`,
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; background: #0a1720; color: #e8eef2; padding: 40px; border-radius: 12px;">
        <h1 style="color: #c9a84c; font-size: 24px; margin-bottom: 24px;">Nova rezervacija!</h1>
        <div style="background: #122736; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <p style="margin: 4px 0;"><strong style="color: #c9a84c;">Ime:</strong> ${name}</p>
          <p style="margin: 4px 0;"><strong style="color: #c9a84c;">Email:</strong> ${email}</p>
          <p style="margin: 4px 0;"><strong style="color: #c9a84c;">Dogodek:</strong> ${event.titleSl}</p>
          <p style="margin: 4px 0;"><strong style="color: #c9a84c;">Datum:</strong> ${formattedDate}</p>
          <p style="margin: 4px 0;"><strong style="color: #c9a84c;">Lokacija:</strong> ${event.location}</p>
          <p style="margin: 4px 0;"><strong style="color: #c9a84c;">Število parov:</strong> ${numberOfPairs}</p>
          <p style="margin: 4px 0;"><strong style="color: #c9a84c;">Cena:</strong> ${pricePerPair} na par</p>
          <p style="margin: 4px 0;"><strong style="color: #c9a84c;">Plačilo:</strong> ${paymentLabel}</p>
          <p style="margin: 4px 0;"><strong style="color: #c9a84c;">ID:</strong> ${reservationId}</p>
        </div>
      </div>
    `,
  });
}

export async function sendContactNotification(data: { name: string; email: string; message: string }) {
  const apiKey = import.meta.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log('RESEND_API_KEY not set, skipping email');
    return;
  }

  const { Resend } = await import('resend');
  const resend = new Resend(apiKey);

  await resend.emails.send({
    from: 'Divana <onboarding@resend.dev>',
    replyTo: 'carobnizvok@gmail.com',
    to: 'carobnizvok@gmail.com',
    subject: `Novo sporočilo od ${data.name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <p><strong>Od:</strong> ${data.name} (${data.email})</p>
        <p><strong>Sporočilo:</strong></p>
        <p>${data.message.replace(/\n/g, '<br/>')}</p>
      </div>
    `,
  });
}
