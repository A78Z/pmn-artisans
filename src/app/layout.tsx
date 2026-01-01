import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PMN DATAHUB ARTISANS",
  description: "Plateforme sécurisée de consultation des données des artisans du Sénégal",
};

import { Providers } from "./providers";

// ... existing code ...

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <div
            style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
          >
            {children}
          </div>
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
               document.addEventListener('contextmenu', event => event.preventDefault());
               document.addEventListener('keydown', function(event) {
                  if((event.ctrlKey || event.metaKey) && (event.key === 'c' || event.key === 'p' || event.key === 's')) {
                      event.preventDefault();
                  }
               });
             `
          }}
        />
      </body>
    </html>
  );
}
