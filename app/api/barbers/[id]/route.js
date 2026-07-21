import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { verifySessionToken } from '../../../../lib/auth';

export async function DELETE(req, { params }) {
  const token = req.cookies.get('session')?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Solo el dueño puede eliminar barberos' }, { status: 403 });
  }
  await prisma.barber.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
