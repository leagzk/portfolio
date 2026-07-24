/*
  Chrome du site : menu mobile, menu deroulant "Selected work", choix de theme,
  barres collees au defilement. Rendu par Base.astro, donc present sur toutes
  les pages.

  Ce qui n'est PAS ici : la pose de la classe .js et la restauration du theme.
  Ces deux-la doivent s'executer avant le premier rendu et vivent dans le
  <script is:inline> du <head>. Un module bundle est type="module", donc differe.
*/
export function initChrome(): void {
  const root = document.documentElement;

  /* declares en tete : setOpen ci-dessous referencait topnav avant sa
     declaration, ce qui ne tenait que par le hoisting de var */
  const topnav = document.querySelector<HTMLElement>('.topnav');
  const mobbar = document.getElementById('mobbar');
  const topdock = document.querySelector<HTMLElement>('.topdock');

  /* ---------------------------------------------------------- menu mobile */
  const hamb = document.getElementById('hamb');
  const mob = document.getElementById('mobmenu');
  const mobc = document.getElementById('mobclose');

  /*
    Le menu est en position:fixed par-dessus la page, mais le contenu derriere
    restait atteignable au Tab. `inert` le retire d'un coup de l'ordre de
    tabulation ET de l'arbre d'accessibilite - ce que aria-hidden seul ne fait pas.
  */
  const derriere = [
    ...document.querySelectorAll('.topdock,.mobbar,.topnav,#main,.talk-card,a.sr-only'),
  ];

  const menuOpen = (o: boolean) => {
    if (!mob) return;
    mob.classList.toggle('open', o);
    hamb?.setAttribute('aria-expanded', o ? 'true' : 'false');
    mob.setAttribute('aria-hidden', o ? 'false' : 'true');
    document.body.style.overflow = o ? 'hidden' : '';
    derriere.forEach((el) => (o ? el.setAttribute('inert', '') : el.removeAttribute('inert')));
    /* sans ce deplacement, le focus reste sur le hamburger devenu inerte */
    if (o) mobc?.focus();
  };

  hamb?.addEventListener('click', () => menuOpen(true));
  mobc?.addEventListener('click', () => {
    menuOpen(false);
    hamb?.focus();
  });
  mob?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => menuOpen(false)));

  /* ------------------------------------- menu deroulant "Selected work" */
  const navgroup = document.querySelector<HTMLElement>('.navgroup');
  const trig = navgroup?.querySelector<HTMLElement>('.navgroup__trigger');

  const setOpen = (o: boolean) => {
    navgroup?.classList.toggle('open', o);
    trig?.setAttribute('aria-expanded', o ? 'true' : 'false');
    topnav?.classList.toggle('menuopen', o);
  };

  if (navgroup) {
    navgroup.addEventListener('mouseenter', () => setOpen(true));
    navgroup.addEventListener('mouseleave', () => setOpen(false));
    navgroup.addEventListener('focusin', () => setOpen(true));
    navgroup.addEventListener('focusout', (e) => {
      if (!navgroup.contains(e.relatedTarget as Node)) setOpen(false);
    });
    trig?.addEventListener('click', () => setOpen(!navgroup.classList.contains('open')));
  }

  /* un seul ecouteur Escape pour les deux surfaces, au lieu de deux */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (mob?.classList.contains('open')) {
      menuOpen(false);
      hamb?.focus();
    } else if (navgroup?.classList.contains('open')) {
      setOpen(false);
      trig?.focus();
    }
  });

  /* --------------------------------------- easter-egg piment + themes */
  const pepperbtn = document.getElementById('pepperbtn');
  const pepperegg = document.getElementById('pepperegg');

  pepperegg?.addEventListener('mouseenter', () => {
    pepperegg.classList.remove('picked');
    pepperbtn?.setAttribute('aria-expanded', 'true');
  });
  pepperegg?.addEventListener('mouseleave', () => {
    pepperegg.classList.remove('picked', 'open');
    pepperbtn?.setAttribute('aria-expanded', 'false');
  });
  pepperbtn?.addEventListener('click', () => {
    pepperegg?.classList.remove('picked');
    const o = pepperegg?.classList.toggle('open');
    pepperbtn.setAttribute('aria-expanded', o ? 'true' : 'false');
  });

  /*
    Choix de theme : ecrit sur <html data-theme> ET persiste.
    Les themes "contrast" et "mono" sont le dispositif d'accessibilite du site
    (le rouge de "spicy" est un parti pris graphique assume, a 4,0:1). Un choix
    d'accessibilite qui ne survit pas a un clic sur un lien n'en est pas un.
    La restauration se fait dans le script inline du <head>.
  */
  const btns = [...document.querySelectorAll<HTMLElement>('.swatch')];
  const syncPressed = (theme: string | null) => {
    btns.forEach((x) =>
      x.setAttribute('aria-pressed', x.getAttribute('data-set') === theme ? 'true' : 'false'),
    );
  };
  /* l'etat ecrit dans le HTML suppose "spicy" : le realigner sur le theme restaure */
  syncPressed(root.getAttribute('data-theme'));

  btns.forEach((b) => {
    b.addEventListener('click', () => {
      const theme = b.getAttribute('data-set');
      if (!theme) return;
      root.setAttribute('data-theme', theme);
      syncPressed(theme);
      try {
        localStorage.setItem('theme', theme);
      } catch {
        /* stockage refuse : le theme tient pour la page courante */
      }
      pepperegg?.classList.add('picked');
      pepperegg?.classList.remove('open');
      pepperbtn?.setAttribute('aria-expanded', 'false');
      b.blur();
    });
  });

  /* ------------------- barres collees : fond des le premier defilement */
  let ticking = false;
  const syncBar = () => {
    const scrolled = (window.pageYOffset || root.scrollTop || 0) > 4;
    mobbar?.classList.toggle('show', scrolled);
    topnav?.classList.toggle('stuck', scrolled);
    topdock?.classList.toggle('stuck', scrolled);
    ticking = false;
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(syncBar);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  syncBar();
}
