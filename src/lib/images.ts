import type { ImageMetadata } from 'astro';

/*
  Resolution d'une image de dossier, par nom court.

  Les deux case studies chargent leurs visuels en un seul `import.meta.glob`
  plutot qu'en trente-et-un imports nommes, puis les adressent par nom :
  `img('staging-arch')`. La fonction de recherche - construire la cle, verifier,
  jeter - etait recopiee dans les deux pages, au message d'erreur pres.

  Le glob lui-meme RESTE dans la page : `import.meta.glob` exige un motif
  litteral, resolu a la compilation et relatif au fichier qui l'ecrit. Il ne peut
  donc pas etre parametre depuis ici. Ce qui se partage, c'est tout le reste.

  L'interet du glob, lui, ne change pas : un nom errone casse le build, la ou un
  chemin en chaine aurait produit un 404 silencieux en production.
*/
export function chercheurImages(
  fichiers: Record<string, ImageMetadata>,
  dossier: string,
): (nom: string) => ImageMetadata {
  return (nom) => {
    const f = fichiers[`../assets/${dossier}/${nom}.webp`];
    if (!f) throw new Error(`Image introuvable dans src/assets/${dossier} : ${nom}.webp`);
    return f;
  };
}
