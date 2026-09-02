import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getSessionFromRequest } from '../../../../lib/auth';

export async function DELETE(req, { params }) {
  const session = await getSessionFromRequest(req);
  if (session?.role === 'demo') {
    return NextResponse.json({ error: 'Cuenta demo: esta acción está deshabilitada' }, { status: 403 });
  }

  await prisma.cut.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
