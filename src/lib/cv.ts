import { poidsPublic } from './poids';

/*
  LE CV, DECLARE UNE FOIS.

  Le chemin et le poids vivaient en dur dans quatre fichiers - le CTA du hero,
  le footer du hero mobile, le footer du layout, le bouton de l'accueil. Le jour
  ou le PDF est remplace, les quatre mentent ensemble : le fichier est passe de
  3,6 a 4,3 Mo et les quatre annoncaient toujours 3,6.

  LA LECTURE DU POIDS EST PARTIE DANS src/lib/poids.ts le jour ou le one-pager
  des awards a eu besoin de la meme chose. Ce qui reste ici, c'est le CV : son
  chemin, et son poids tenu a jour tout seul par un `npm run build`.
*/
export const CV_HREF = '/Lea-Giezek-CV.pdf';

/** « PDF, 2.1 MB » - annonce au lecteur d'ecran avant le telechargement */
export const CV_POIDS = poidsPublic('Lea-Giezek-CV.pdf');
