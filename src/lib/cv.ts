import { statSync } from 'node:fs';
import { join } from 'node:path';

/*
  LE CV, DECLARE UNE FOIS.

  Le chemin et le poids vivaient en dur dans quatre fichiers - le CTA du hero,
  le footer du hero mobile, le footer du layout, le bouton de l'accueil. Le jour
  ou le PDF est remplace, les quatre mentent ensemble : le fichier est passe de
  3,6 a 4,3 Mo et les quatre annoncaient toujours 3,6.

  LE POIDS EST LU DANS LE FICHIER A LA COMPILATION. Le site est statique, donc
  ce `statSync` ne tourne qu'au build - jamais chez le visiteur - et le chiffre
  ne peut plus diverger du fichier servi. Un CV remplace et un `npm run build`
  suffisent.

  « MB » ET NON « Mo » : la page est en anglais, et le lecteur d'ecran la lit en
  anglais. L'unite francaise y passait pour une coquille.
*/
export const CV_HREF = '/Lea-Giezek-CV.pdf';

const octets = statSync(join(process.cwd(), 'public', 'Lea-Giezek-CV.pdf')).size;

/** « PDF, 4.3 MB » - annonce au lecteur d'ecran avant le telechargement */
export const CV_POIDS = `PDF, ${(octets / 1_048_576).toFixed(1)} MB`;
