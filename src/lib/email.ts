interface ConfirmationEmailData {
  email: string;
  name: string;
  event: { titleSl: string; date: Date; location: string; price: number | null };
  numberOfPairs: number;
  reservationId: string;
}

export async function sendConfirmationEmail(data: ConfirmationEmailData) {
  const apiKey = import.meta.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log('RESEND_API_KEY not set, skipping email');
    return;
  }

  const { Resend } = await import('resend');
  const resend = new Resend(apiKey);

  const { email, name, event, numberOfPairs, reservationId } = data;
  const formattedDate = new Intl.DateTimeFormat('sl-SI', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(event.date));

  await resend.emails.send({
    from: 'Divana <rezervacije@divana.si>',
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
          ${event.price ? `<p style="margin: 4px 0;"><strong style="color: #c9a84c;">Cena:</strong> ${(event.price / 100).toFixed(0)}&euro; na par</p>` : ''}
          <p style="margin: 4px 0;"><strong style="color: #c9a84c;">ID rezervacije:</strong> ${reservationId}</p>
        </div>
        <p>Veselimo se vašega obiska!</p>
        <p style="margin-top: 24px; color: #7a9cb2;">Lep pozdrav,<br/>Divana - Maja Marinčič</p>
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
    from: 'Divana Website <info@divana.si>',
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
