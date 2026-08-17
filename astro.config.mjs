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

  /*
    Content-Security-Policy, emise par Astro dans un <meta http-equiv> a chaque
    page.

    Pourquoi ici et pas entierement dans vercel.json : `script-src` et
    `style-src` doivent lister l'empreinte de chaque bloc inline de la page, et
    ces empreintes changent des qu'on touche au contenu. Ecrites a la main dans
    un en-tete, elles seraient fausses au build suivant - et une empreinte
    fausse ne degrade pas le site, elle le casse (script du theme bloque, donc
    plus de bascule ni d'animations). Astro les recalcule a chaque build.

    Le reste des en-tetes vit dans vercel.json, parce qu'un <meta> ne peut pas
    les porter : HSTS, et `frame-ancestors` - d'ou le X-Frame-Options: DENY
    cote serveur, qui joue le meme role. Les deux fichiers se lisent ensemble.

    Le site ne contient ni iframe, ni formulaire, ni image distante : tout ce qui
    n'est pas explicitement autorise ci-dessous est refuse par default-src.
  */
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        // Les images passent toutes par l'optimiseur d'Astro, donc meme origine.
        // `data:` couvre les petits SVG inlines dans le CSS, sans ouvrir d'hote.
        "img-src 'self' data:",
        // Nos deux polices sont locales ; le kit Adobe sert les siennes depuis
        // son CDN. Retirer l'hote le jour ou le specimen de /system-event part.
        "font-src 'self' https://use.typekit.net",
        "connect-src 'self'",
        // Rien a soumettre, rien a embarquer, aucune <base> a detourner.
        "form-action 'none'",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'none'",
        /*
          Si une URL http:// se glisse un jour dans une page, le navigateur la
          demande en https au lieu d'afficher un avertissement de contenu mixte.
          C'est exactement ce qu'un proxy d'entreprise signale comme « non
          securise » - autant que le cas ne puisse pas se produire.
        */
        'upgrade-insecure-requests',
      ],
      styleDirective: {
        /*
          `resources` remplace les sources par defaut d'Astro : 'self' doit donc
          y figurer explicitement, sans quoi les feuilles du site sont bloquees.
        */
        resources: [
          "'self'",
          'https://use.typekit.net',
          /*
            Le projet pose des variables CSS dans des attributs style= (par
            exemple --culture-size sur les banniere). Une empreinte ne peut pas
            couvrir un attribut, il faut 'unsafe-inline'. `kind: "attribute"` le
            confine a style-src-attr : les <style> et <link> restent, eux,
            verrouilles par empreinte dans style-src-elem. Un attribut style ne
            peut pas executer de script, la concession est donc sans portee sur
            l'execution de code.
          */
          { resource: "'unsafe-inline'", kind: 'attribute' },
        ],
        /*
          Le build affiche un avertissement [csp] : 'self' et use.typekit.net ne
          s'appliquent pas au scope des attributs. C'est voulu - un attribut
          style= ne charge aucune URL, il n'a besoin d'aucune origine. On
          n'eteint PAS cet avertissement en passant les deux sources en
          `kind: 'element'` : style-src se retrouverait sans source, et les
          navigateurs qui ignorent style-src-elem retomberaient alors sur
          default-src, qui ne porte pas les empreintes - donc plus aucun <style>
          inline chez eux. L'avertissement est le prix de cette compatibilite.
        */
      },
    },
  },

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
