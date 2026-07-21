import { NextResponse } from 'next/server';
import { verifySessionToken } from '../../../lib/auth';

export async function GET(req) {
  const token = req.cookies.get('session')?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return NextResponse.json(session);
}
