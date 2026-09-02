import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getSessionFromRequest } from '../../../../lib/auth';

export async function PATCH(req, { params }) {
  const session = await getSessionFromRequest(req);
  if (session?.role === 'demo') {
    return NextResponse.json({ error: 'Cuenta demo: esta acción está deshabilitada' }, { status: 403 });
  }

  const body = await req.json();
  const data = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.price !== undefined) data.price = Number(body.price) || 0;

  const service = await prisma.service.update({ where: { id: params.id }, data });
  return NextResponse.json(service);
}

export async function DELETE(req, { params }) {
  const session = await getSessionFromRequest(req);
  if (session?.role === 'demo') {
    return NextResponse.json({ error: 'Cuenta demo: esta acción está deshabilitada' }, { status: 403 });
  }

  await prisma.service.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
