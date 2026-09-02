import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getSessionFromRequest } from '../../../lib/auth';

export async function GET() {
  const services = await prisma.service.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(services);
}

export async function POST(req) {
  const session = await getSessionFromRequest(req);
  if (session?.role === 'demo') {
    return NextResponse.json({ error: 'Cuenta demo: esta acción está deshabilitada' }, { status: 403 });
  }

  const { name, price } = await req.json();
  if (!name) {
    return NextResponse.json({ error: 'Falta el nombre del servicio' }, { status: 400 });
  }
  const service = await prisma.service.create({
    data: { name, price: Number(price) || 0 },
  });
  return NextResponse.json(service);
}
