import { SignJWT, jwtVerify } from 'jose';

function secretKey() {
  return new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-cambiar');
}

export async function createSessionToken(barber) {
  return await new SignJWT({ id: barber.id, name: barber.name, username: barber.username, role: barber.role || 'barbero' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secretKey());
}

export async function verifySessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload;
  } catch (e) {
    return null;
  }
}

export async function getSessionFromRequest(req) {
  const token = req.cookies.get('session')?.value;
  return token ? await verifySessionToken(token) : null;
}
