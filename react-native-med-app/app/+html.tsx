import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * This file is web-only and used to configure the root HTML for every web page during static rendering.
 * The contents of this function only run in Node.js environments and do not have access to the DOM or browser APIs.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* 
          Ensures each HTML document contains a non-empty <title> element.
          This helps with navigation and accessibility.
        */}
        <title>FMC App - Study Everywhere | Révision Médecine Constantine</title>
        <meta name="description" content="La plateforme de révision incontournable pour les étudiants en médecine de Constantine et ses annexes. QCMs interactifs, mode hors-ligne et suivi personnalisé." />

        {/* Open Graph */}
        <meta property="og:title" content="FMC App - Study Everywhere" />
        <meta property="og:description" content="La plateforme de révision incontournable pour les étudiants en médecine de Constantine." />
        <meta property="og:type" content="website" />

        {/* Brand Fonts: Manrope (headings) + Cairo (body/Arabic) per brand identity */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Cairo:wght@400;600;700&display=swap" rel="stylesheet" />

        {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: `
          html, body {
            overflow-x: hidden;
            max-width: 100vw;
            position: relative;
          }
        ` }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
        <script defer src="/_vercel/insights/script.js" />
      </head>
      <body>{children}</body>
    </html>
  );
}
