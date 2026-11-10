import { statSync } from 'node:fs';
import { join } from 'node:path';

/*
  LE POIDS D'UN FICHIER DE public/, LU DANS LE FICHIER.

  La lecon vient du CV : le chemin et le poids vivaient en dur dans quatre
  endroits, le PDF est passe de 3,6 a 4,3 Mo, et les quatre ont menti ensemble.
  Le one-pager des awards pose exactement la meme question, donc la lecture
  sort de cv.ts avant d'y etre recopiee.

  LE SITE EST STATIQUE : ce `statSync` ne tourne qu'au build, jamais chez le
  visiteur, et le chiffre ne peut plus diverger du fichier servi.

  « MB » ET NON « Mo » : la page est en anglais, et le lecteur d'ecran la lit
  en anglais. L'unite francaise y passait pour une coquille.
*/

/** « PDF, 18.9 MB » - annonce au lecteur d'ecran avant le telechargement */
export function poidsPublic(nom: string, type = 'PDF'): string {
  const octets = statSync(join(process.cwd(), 'public', nom)).size;
  return `${type}, ${(octets / 1_048_576).toFixed(1)} MB`;
}
