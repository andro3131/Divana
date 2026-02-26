import { db, Event, Reservation } from 'astro:db';

export default async function seed() {
  await db.insert(Event).values([
    {
      id: 'plesni-vecer-2026-03',
      titleSl: 'Plesni večer Divana – Vajin stik',
      titleEn: 'Dance Evening Divana – Your Connection',
      descriptionSl: 'To ni samo plesni večer. Je prostor za pare. Za pogled, ki se ne umakne. Za dotik, ki prebudi vajin gib.',
      descriptionEn: 'This is not just a dance evening. It is a space for couples. For a gaze that does not look away. For a touch that awakens your movement.',
      date: new Date('2026-03-08T18:00:00'),
      location: 'Dvorana Stik, Trebnje',
      price: 5000,
      capacity: 20,
      isPublished: true,
      createdAt: new Date(),
    },
    {
      id: 'plesni-vecer-2026-05',
      titleSl: 'Plesni večer Divana – Pomladni stik',
      titleEn: 'Dance Evening Divana – Spring Connection',
      descriptionSl: 'Pomladni plesni večer za pare, ki si želijo globljega stika.',
      descriptionEn: 'Spring dance evening for couples seeking a deeper connection.',
      date: new Date('2026-05-17T18:00:00'),
      location: 'Dvorana Stik, Trebnje',
      price: 5000,
      capacity: 20,
      isPublished: true,
      createdAt: new Date(),
    },
  ]);

  await db.insert(Reservation).values([
    {
      id: 'seed-reservation-1',
      eventId: 'plesni-vecer-2026-03',
      name: 'Janez Novak',
      email: 'janez@example.com',
      phone: '+386 40 123 456',
      numberOfPairs: 2,
      message: 'Veselimo se!',
      status: 'confirmed',
      createdAt: new Date(),
    },
  ]);
}
