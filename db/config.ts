import { defineDb, defineTable, column } from 'astro:db';

const Event = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    titleSl: column.text(),
    titleEn: column.text({ optional: true }),
    descriptionSl: column.text({ optional: true }),
    descriptionEn: column.text({ optional: true }),
    date: column.date(),
    location: column.text(),
    price: column.number({ optional: true }),
    onlinePrice: column.number({ optional: true }),
    capacity: column.number(),
    imageUrl: column.text({ optional: true }),
    isPublished: column.boolean({ default: true }),
    createdAt: column.date(),
  },
});

const Reservation = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    eventId: column.text({ references: () => Event.columns.id }),
    name: column.text(),
    email: column.text(),
    phone: column.text(),
    numberOfPairs: column.number(),
    message: column.text({ optional: true }),
    status: column.text({ default: 'confirmed' }),
    stripeSessionId: column.text({ optional: true }),
    paymentStatus: column.text({ optional: true }),
    createdAt: column.date(),
  },
});

const ContactMessage = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    name: column.text(),
    email: column.text(),
    message: column.text(),
    createdAt: column.date(),
  },
});

export default defineDb({
  tables: { Event, Reservation, ContactMessage },
});
