import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// HTML-Grundgerüst für den statischen Web-Export (PWA-Einbindung).
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="de">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <title>Musik-Punkte</title>
        <meta name="description" content="Punkteerfassung für den Musikunterricht" />
        <meta name="theme-color" content="#0f766e" />
        <link rel="manifest" href="/musik-punkte/manifest.json" />
        <link rel="icon" type="image/png" href="/musik-punkte/favicon.png" />
        <link rel="apple-touch-icon" href="/musik-punkte/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Musik-Punkte" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && location.protocol === 'https:') {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('/musik-punkte/sw.js');
                });
              }
            `,
          }}
        />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
