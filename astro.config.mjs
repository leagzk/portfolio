import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/*
  Racine du site en production : l'apex, sans www.
  C'est lui que Vercel sert (200) ; www.leagiezek.design redirige vers lui.
  Ne pas mettre le www ici : les URLs canoniques et le sitemap designeraient
  alors un hote qui redirige ailleurs.
  Toute modification impose de resoumettre le sitemap dans la Search Console.
*/
const SITE = 'https://leagiezek.design';

export default defineConfig({
  // Sortie statique : Vercel sert directement le dossier dist/
  output: 'static',
  build: { format: 'directory' },

  // Racine absolue : requise pour <link rel="canonical">, Open Graph et le sitemap.
  site: SITE,

  /*
    Scoping des styles en :where() plutot qu'en [data-astro-cid-*].
    Le defaut d'Astro ajoute +1 de specificite a chaque regle scopee. Or toute la
    cascade du projet repose sur des paires base/override separees d'exactement une
    classe (.btn--ghost vs [data-theme="contrast"] .btn--ghost). Sans cette option,
    descendre une regle globale dans un <style> scope creerait une egalite de
    specificite, et l'ordre des fichiers dans le bundle deciderait du vainqueur.
    Prerequis des etapes 3 et 4.
  */
  scopedStyleStrategy: 'where',

  image: {
    // Styles globaux des images responsives, appliques en :where() donc surchargeables.
    responsiveStyles: true,
    /*
      Service maison : le service sharp d'Astro plus keepMetadata(), pour que
      l'optimisation n'efface pas le copyright XMP des photos (Madeleine
      Photographe). Voir l'en-tete de src/imageService.mjs.
    */
    service: { entrypoint: './src/imageService.mjs' },
  },

  integrations: [
    sitemap({
      /*
        Le sitemap ne doit lister que ce qu'on veut voir indexe. Sans ce filtre
        il contredirait le <meta name="robots" content="noindex"> des brouillons :
        on demanderait a Google de crawler des pages qu'on lui dit d'ignorer.
        Retirer une entree d'ici quand la page correspondante est redigee.
      */
      filter: (page) =>
        !/\/(operating-system|system-brand|system-practice-elements|404)\/?$/.test(page),
    }),
  ],
});
