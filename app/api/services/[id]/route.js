import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function PATCH(req, { params }) {
  const body = await req.json();
  const data = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.price !== undefined) data.price = Number(body.price) || 0;

  const service = await prisma.service.update({ where: { id: params.id }, data });
  return NextResponse.json(service);
}

export async function DELETE(req, { params }) {
  await prisma.service.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
