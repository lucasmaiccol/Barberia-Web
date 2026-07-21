# Barbería — App de gestión (versión web independiente)

Esta es la versión "de verdad" de la app: sitio propio, con login solo para
barberos, y una base de datos real (no vive dentro de Claude).

Importante: yo no tengo acceso a internet desde donde armé este proyecto, así
que no pude instalar las dependencias ni probarlo corriendo en vivo. Los pasos
de abajo están pensados para que los sigas vos (o para pedirle a **Claude
Code** que los ejecute por vos, ya que Claude Code sí tiene conexión a
internet y puede crear cuentas, correr comandos, y subir el código).

## Qué vas a necesitar (todo gratis para empezar)

- Una cuenta en [Supabase](https://supabase.com) → base de datos Postgres gratis
- Una cuenta en [GitHub](https://github.com) → para guardar el código
- Una cuenta en [Vercel](https://vercel.com) → hosting gratis
- Node.js instalado si querés probarlo en tu computadora antes de publicarlo

## 1. Crear la base de datos

1. Entrá a Supabase → "New Project".
2. Cuando esté creado, andá a **Project Settings → Database → Connection string → URI**.
3. Copiá esa cadena, la vas a necesitar en el paso siguiente.

## 2. Configurar el proyecto

1. Copiá `.env.example` a un archivo nuevo llamado `.env`.
2. Pegá la cadena de conexión de Supabase en `DATABASE_URL`.
3. En `JWT_SECRET` poné cualquier texto largo y aleatorio (por ejemplo, generado en https://generate-secret.vercel.app/32).

## 3. Instalar y preparar la base de datos

Desde la carpeta del proyecto:

```bash
npm install
npx prisma db push
npm run seed
```

Esto crea las tablas y carga un barbero inicial (`admin` / `barbero123`) y
los servicios de ejemplo (cortes y tintes con precios de referencia).
**Cambiá esa contraseña o borrá ese usuario en cuanto entres.**

## 4. Probarlo en tu computadora

```bash
npm run dev
```

Abrí `http://localhost:3000/login` y entrá con el usuario inicial.

## 5. Publicarlo con dominio propio

1. Subí el código a un repositorio nuevo en GitHub.
2. En Vercel: "Add New Project" → importá ese repositorio.
3. En "Environment Variables" agregá `DATABASE_URL` y `JWT_SECRET` (los mismos valores del `.env`).
4. Hacé clic en "Deploy". Vercel te da una URL tipo `tu-barberia.vercel.app`.
5. Si el local quiere un dominio propio (ej. `barberiajuan.com.uy`), lo comprás
   en cualquier registrador y lo conectás desde Vercel → Settings → Domains.

## Cómo entran los barberos

Cada barbero tiene su propio usuario y contraseña. Se agregan desde la
pestaña **"Equipo"** dentro de "Precios y equipo", una vez que vos (el admin)
ya iniciaste sesión. Nadie puede ver ni usar la app sin loguearse primero.

## Sobre el modelo de cobro mensual

Con este stack, el costo real de mantener la app para un solo local es
prácticamente $0 (Supabase y Vercel free tier alcanzan de sobra para un
negocio chico). Eso significa que la cuota mensual que le cobres al local
es, en su gran mayoría, tu honorario por mantenimiento y soporte — vale la
pena dejarle esto claro al vender el servicio.

## Ideas para más adelante

- Que cada barbero pueda cambiar su propia contraseña desde la app.
- Recordatorios de turnos por WhatsApp.
- Exportar reportes de caja a Excel o PDF.
