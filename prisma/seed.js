const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const existingBarbers = await prisma.barber.count();
  if (existingBarbers === 0) {
    const hashed = await bcrypt.hash('barbero123', 10);
    await prisma.barber.create({
      data: { name: 'Admin', username: 'admin', password: hashed, role: 'admin' },
    });
    console.log('Barbero inicial creado -> usuario: admin / contraseña: barbero123 (rol: dueño)');
    console.log('IMPORTANTE: entrá y cambiá esa contraseña, o borrá este usuario y creá uno por cada barbero real desde la pestaña "Equipo".');
  } else {
    console.log('Ya hay barberos cargados, no se creó ninguno nuevo.');
  }

  // Si ya tenías un usuario "admin" de antes (creado antes de que existieran los roles),
  // nos aseguramos de que quede marcado como dueño.
  const adminUser = await prisma.barber.findUnique({ where: { username: 'admin' } });
  if (adminUser && adminUser.role !== 'admin') {
    await prisma.barber.update({ where: { username: 'admin' }, data: { role: 'admin' } });
    console.log('El usuario "admin" fue actualizado a rol de dueño.');
  }

  const existingServices = await prisma.service.count();
  if (existingServices === 0) {
    await prisma.service.createMany({
      data: [
        { name: 'Corte clásico', price: 450 },
        { name: 'Corte + barba', price: 650 },
        { name: 'Barba', price: 300 },
        { name: 'Corte niño', price: 350 },
        { name: 'Diseño / línea', price: 200 },
        { name: 'Tinte cobertura de canas', price: 800 },
        { name: 'Tinte de barba', price: 400 },
        { name: 'Platinado / decoloración', price: 1600 },
        { name: 'Mechas / reflejos', price: 1400 },
        { name: 'Color fantasía (mechón)', price: 900 },
      ],
    });
    console.log('Servicios de ejemplo creados (los podés editar o borrar desde la app).');
  } else {
    console.log('Ya hay servicios cargados, no se agregó ninguno nuevo.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
