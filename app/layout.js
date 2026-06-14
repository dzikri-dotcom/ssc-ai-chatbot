export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        {/* Tambahkan baris ini agar Tailwind aktif tanpa globals.css */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>{children}</body>
    </html>
  );
}