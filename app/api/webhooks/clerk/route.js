import { Webhook } from 'svix';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

export async function POST(req) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET env variable');
    return new Response('Server misconfigured', { status: 500 });
  }

  // Get headers
  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  // Get body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify webhook signature
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt;

  try {
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
  } catch (err) {
    console.error('Webhook verification failed:', err.message);
    return new Response('Invalid signature', { status: 400 });
  }

  const eventType = evt.type;

  // ── Handle user.created ──
  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    const email = email_addresses?.[0]?.email_address;
    const name = [first_name, last_name].filter(Boolean).join(' ') || 'User';

    try {
      await prisma.user.create({
        data: {
          clerkId: id,
          email: email,
          name: name,
          avatarUrl: image_url || null,
        },
      });
      console.log(`User created in DB: ${id}`);
    } catch (err) {
      // If user already exists (race condition), just log it
      if (err.code === 'P2002') {
        console.log(`User already exists: ${id}`);
      } else {
        console.error('Error creating user:', err);
        return new Response('DB error', { status: 500 });
      }
    }
  }

  // ── Handle user.updated ──
  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    const email = email_addresses?.[0]?.email_address;
    const name = [first_name, last_name].filter(Boolean).join(' ') || 'User';

    try {
      await prisma.user.upsert({
        where: { clerkId: id },
        update: {
          email: email,
          name: name,
          avatarUrl: image_url || null,
        },
        create: {
          clerkId: id,
          email: email,
          name: name,
          avatarUrl: image_url || null,
        },
      });
      console.log(`User updated in DB: ${id}`);
    } catch (err) {
      console.error('Error updating user:', err);
    }
  }

  // ── Handle user.deleted ──
  if (eventType === 'user.deleted') {
    const { id } = evt.data;

    try {
      await prisma.user.deleteMany({
        where: { clerkId: id },
      });
      console.log(`User deleted from DB: ${id}`);
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  }

  return new Response('OK', { status: 200 });
}
