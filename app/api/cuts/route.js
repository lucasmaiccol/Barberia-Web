import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  const cuts = await prisma.cut.findMany({ orderBy: { date: 'desc' } });
  return NextResponse.json(cuts);
}

export async function POST(req) {
  const body = await req.json();
  const { date, barberId, barberName, client, serviceId, serviceName, price, notes } = body;

  if (!date || !barberId || !client || !serviceId) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
  }

  const cut = await prisma.cut.create({
    data: {
      date,
      barberId,
      barberName: barberName || '',
      client,
      serviceId,
      serviceName: serviceName || '',
      price: Number(price) || 0,
      notes: notes || '',
    },
  });
  return NextResponse.json(cut);
}
