/*
  Les entrees de navigation, declarees une fois.

  Elles vivaient dans Base.astro, en deux tableaux - `main` et `work` - parce
  que la nav avait un menu deroulant « Selected work ». Le brief l'aplatit :
  six liens ferres a droite, sans groupe (§2.1). Les deux tableaux n'ont plus
  de raison d'etre separes.

  LES LIBELLES RACCOURCISSENT, PAS LES ROUTES. « Operating System » devient
  « Operations », « Systematize a Practice » devient « System », et ainsi de
  suite : c'est ce que demande le brief, et c'est ce qui permet de tenir six
  entrees sur une ligne. Les URL, elles, ne bougent pas - les changer casserait
  les liens existants, le sitemap et les positions acquises.

  `cle` est la valeur que chaque page passe en `courant` : elle sert a poser
  aria-current, donc le soulignement jaune de la page ouverte.

  L'ordre est celui du brief. Il n'est pas chronologique : il va du point de
  vue (Philosophy, Operations) aux preuves (System, Brand, Event), et finit par
  la prise de contact.
*/
export interface EntreeNav {
  cle: string;
  href: string;
  libelle: string;
}

export const entrees: EntreeNav[] = [
  { cle: 'philosophy', href: '/philosophy', libelle: 'Philosophy' },
  { cle: 'operating-system', href: '/operating-system', libelle: 'Operations' },
  { cle: 'system-practice-elements', href: '/system-practice-elements', libelle: 'System' },
  { cle: 'system-brand', href: '/system-brand', libelle: 'Brand' },
  { cle: 'system-event', href: '/system-event', libelle: 'Event' },
  { cle: 'connect', href: '#connect', libelle: 'Connect' },
];
