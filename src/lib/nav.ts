/*
  Les entrees de navigation, declarees une fois.

  Elles vivaient dans Base.astro, en deux tableaux - `main` et `work` - parce
  que la nav avait un menu deroulant « Selected work ». Le brief l'aplatit :
  six liens ferres a droite, sans groupe (§2.1). Les deux tableaux n'ont plus
  de raison d'etre separes.

  LES LIBELLES NOMMENT L'OBJET, PAS LA PAGE. Ils ont d'abord ete raccourcis au
  maximum - « System », « Brand », « Event » - pour tenir six entrees sur une
  ligne. Lea les a repris : « Experience System », « Brand Platform »,
  « Event System », « Operating Model ». C'est plus long, et c'est le but - un
  recruteur qui survole la barre doit lire CE QUI A ETE CONSTRUIT, pas un mot
  de code interne. « Brand » ne dit rien ; « Brand Platform » est un livrable.

  Ils ne reprennent donc PAS les noms de la composition d'accueil - Governance,
  Language, Surfaces - ni les titres des pages. C'est volontaire : la tuile et
  le titre nomment le recit, la nav nomme l'objet. Les deux se rejoignent sur
  la page, ou le surtitre du hero donne les deux.

  Les URL, elles, ne bougent pas - les changer casserait les liens existants,
  le sitemap et les positions acquises.

  `cle` est la valeur que chaque page passe en `courant` : elle sert a poser
  aria-current, donc le soulignement jaune de la page ouverte.

  L'ORDRE EST INVERSE PAR RAPPORT AU BRIEF, a la demande de Lea : les trois
  preuves d'abord, le point de vue ensuite. La barre ouvre donc sur ce qui a
  ete construit - un systeme d'experience, une plateforme de marque, un systeme
  evenementiel - et garde le modele de travail et les convictions pour qui veut
  aller plus loin. Elle finit toujours par la prise de contact.
*/
export interface EntreeNav {
  cle: string;
  href: string;
  libelle: string;
  /*
    Le groupe ne sert QU'AU MENU MOBILE. La nav de bureau est une ligne plate
    de six liens (§2.1) et ignore ce champ ; le panneau mobile, lui, a la place
    de respirer et range ses liens en TROIS sections surtitrees : « Selected
    work » pour les trois etudes de cas, « Leading People » pour le modele de
    travail et les convictions, « Let's talk » pour les trois moyens de
    contact. Les trois du haut disent ce qui a ete construit, les deux du
    milieu la maniere de diriger. Aucune entree ne tombe plus au milieu des
    autres sans etre annoncee.
  */
  groupe: 'principal' | 'travaux' | 'contact';
}

export const entrees: EntreeNav[] = [
  { cle: 'system-practice-elements', href: '/system-practice-elements', libelle: 'Experience System', groupe: 'travaux' },
  { cle: 'system-brand', href: '/system-brand', libelle: 'Brand Platform', groupe: 'travaux' },
  { cle: 'system-event', href: '/system-event', libelle: 'Event System', groupe: 'travaux' },
  { cle: 'operating-system', href: '/operating-system', libelle: 'Operating Model', groupe: 'principal' },
  { cle: 'philosophy', href: '/philosophy', libelle: 'Philosophy', groupe: 'principal' },
  { cle: 'connect', href: '#connect', libelle: 'Connect', groupe: 'contact' },
];
