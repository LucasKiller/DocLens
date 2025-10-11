export const metadata = {
  title: 'DocLens',
  description: 'Assistente de IA para documentos',
};

import { Toaster } from 'sonner';
// @ts-ignore: allow side-effect CSS import without type declarations
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body>
        <nav className="flex items-center gap-2 px-6 py-4">
          <span className="text-xl">✨</span>
          <span className="font-semibold tracking-tight">DocLens</span>
        </nav>
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
