import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  const services = await prisma.service.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(services);
}

export async function POST(req) {
  const { name, price } = await req.json();
  if (!name) {
    return NextResponse.json({ error: 'Falta el nombre del servicio' }, { status: 400 });
  }
  const service = await prisma.service.create({
    data: { name, price: Number(price) || 0 },
  });
  return NextResponse.json(service);
}
