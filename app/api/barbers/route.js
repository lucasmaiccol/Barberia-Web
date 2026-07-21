import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../lib/prisma';
import { verifySessionToken } from '../../../lib/auth';

async function requireAdmin(req) {
  const token = req.cookies.get('session')?.value;
  const session = token ? await verifySessionToken(token) : null;
  return session && session.role === 'admin';
}

export async function GET() {
  const barbers = await prisma.barber.findMany({
    select: { id: true, name: true, username: true, role: true },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(barbers);
}

export async function POST(req) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Solo el dueño puede agregar barberos' }, { status: 403 });
  }

  const { name, username, password, role } = await req.json();

  if (!name || !username || !password) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
  }

  const exists = await prisma.barber.findUnique({ where: { username } });
  if (exists) {
    return NextResponse.json({ error: 'Ese usuario ya existe' }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const barber = await prisma.barber.create({
    data: { name, username, password: hashed, role: role === 'admin' ? 'admin' : 'barbero' },
    select: { id: true, name: true, username: true, role: true },
  });
  return NextResponse.json(barber);
}
