/*
  Numerotation d'un sommaire, derivee du rang.

  Les trois pages chapitrees - /system-event, /system-practice-elements et
  /operating-system - declarent chacune leur liste de chapitres, puis en
  derivaient le numero avec leur propre helper. Trois implementations du meme
  geste : chercher l'id, jeter s'il est inconnu, formater sur deux chiffres. Les
  messages d'erreur avaient deja diverge (« Chapitre inconnu » ici,
  « Principe inconnu » la) et le padStart(2,'0') etait recopie a chaque fois.

  Le numero vient TOUJOURS du rang, jamais d'un champ ecrit a la main : c'est ce
  qui fait que reordonner la liste renumerote, et qu'un chapitre insere au milieu
  ne demande aucune retouche ailleurs.

  L'acces jette au lieu de retourner undefined. Un id renomme casse donc le
  build, la ou un retour vide aurait produit un surtitre ampute - « - The
  results » - ou une ancre morte, tous deux invisibles en relecture.
*/

/** Le minimum qu'une entree doit porter pour etre numerotee et intitulee. */
export interface EntreeSommaire {
  /** id de l'ancre, cible des liens de <ChapterTabs> */
  id: string;
  /** intitule long, celui du surtitre de section */
  titre: string;
}

export interface Sommaire<T extends EntreeSommaire> {
  /** numero sur deux chiffres : « 03 » */
  num(id: string): string;
  /** l'entree complete, avec les champs propres a la page */
  de(id: string): T;
  /** surtitre de section : « 03 - The problem » */
  surtitre(id: string): string;
}

export function sommaire<T extends EntreeSommaire>(chapitres: T[]): Sommaire<T> {
  const rang = (id: string): number => {
    const i = chapitres.findIndex((c) => c.id === id);
    if (i < 0) throw new Error(`Chapitre inconnu : ${id}`);
    return i;
  };

  const num = (id: string) => String(rang(id) + 1).padStart(2, '0');

  return {
    num,
    de: (id) => chapitres[rang(id)],
    surtitre: (id) => `${num(id)} - ${chapitres[rang(id)].titre}`,
  };
}
