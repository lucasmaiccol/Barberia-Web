import './globals.css';

export const metadata = {
  title: 'Barbería — Panel de gestión',
  description: 'Registro de cortes, precios y clientes',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
