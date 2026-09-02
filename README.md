#  Barbershop — Management System

A management system for barbershops: cut/service logging, cash register tracking, service pricing, and staff management, with login and role-based access. Built to be rented out as a monthly service to real barbershops.

 **Live demo:** [barberia-web-smoky.vercel.app](https://barberia-web-smoky.vercel.app/)

> **Try it yourself** — username: `demo` / password: `demo123`
> The demo account can browse everything but can't add, edit, or delete anything.

---

##  Features

- **Cut logging** — each barber logs their daily services (client, service, price, notes)
- **History** — search and filter through all logged cuts
- **Pricing & staff** — manage services (create, edit, delete) and barbers
- **Cash register** — revenue summary by period
- **Role-based login** — owner (`admin`), regular staff (`barbero`), and a restricted read-only `demo` role
- **Persistent sessions** — authentication via HTTP-only cookies, no tokens exposed to the client

##  Tech stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| Database | PostgreSQL ([Supabase](https://supabase.com)) |
| ORM | [Prisma](https://www.prisma.io/) |
| Auth | JWT ([jose](https://github.com/panva/jose)) + HTTP-only cookies + [bcryptjs](https://github.com/dcodeIO/bcrypt.js) |
| UI | React 18, custom CSS, [lucide-react](https://lucide.dev/) |
| Hosting | [Vercel](https://vercel.com) |

##  Architecture

```
app/
├── api/            # API routes (login, barbers, services, cuts)
├── login/          # Login page
├── page.js         # Main dashboard (tabs: log, history, pricing, cash)
lib/
├── auth.js         # JWT signing & verification, session helper
├── prisma.js        # Prisma client
prisma/
├── schema.prisma    # Models: Barber, Service, Cut
middleware.js        # Protects all routes except /login
```

Every route is protected by auth middleware except `/login`. Database access always goes through the backend (Next.js API routes) via Prisma — the client never connects to the database directly. Write actions (create/edit/delete) are additionally blocked at the API level for the `demo` role.

##  Run it locally

```bash
git clone https://github.com/lucasmaiccol/Barberia-Web.git
cd Barberia-Web
npm install
```

Create a `.env` file with:

```
DATABASE_URL="your Postgres/Supabase connection string"
JWT_SECRET="a long, random string"
```

Set up the database and run:

```bash
npx prisma db push
npm run seed
npm run dev
```

Open `http://localhost:3000/login`.

##  Roadmap

- [ ] Let each barber change their own password
- [ ] WhatsApp appointment reminders
- [ ] Export cash register reports to Excel/PDF

---

Built by [Lucas Maicol](https://github.com/lucasmaiccol) — Web Developer & AI Automation.
