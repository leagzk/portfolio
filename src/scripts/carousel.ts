import { mouvementReduit } from './motion';

export interface Arc {
  /** amplitude verticale, en px */
  y: number;
  /** rotation aux extremites, en degres */
  deg: number;
  /** reduction d'echelle aux extremites, 0 a 1 */
  scale: number;
}

/*
  La courbure des rails de vignettes et de cartes. Ces trois coefficients etaient
  recopies a l'identique sur quatre appels - les surfaces de /system-event, les
  facettes, les resultats et les preuves d'Elements. Recopies, ils derivent : un
  rail se serait retrouve a courber autrement que ses voisins sans que personne
  ne l'ait decide.
  Les axes d'Elements gardent leur propre valeur, plus plate : leurs cartes sont
  plus hautes, et la meme amplitude y penchait trop.
*/
export const ARC_VIGNETTE: Arc = { y: 18, deg: 4.5, scale: 0.05 };

export interface OptionsCarrousel {
  /** selecteur des vignettes, relatif a la piste */
  slides: string;
  /** pastilles de pagination, dans l'ordre des vignettes */
  dots?: HTMLElement[];
  /** courbure appliquee au defilement ; false pour aucune */
  arc?: Arc | false;
  /** media query au-dela de laquelle le carrousel est inactif (accueil) ; omis = toujours actif */
  actifSi?: string;
  /** classe posee sur la pastille active, en plus de aria-current */
  classeDotActive?: string;
  /** vignette centree a l'ouverture */
  depart?: number;
}

/*
  Carrousel a defilement horizontal : centrage, pastilles et courbure.

  Le code vivait en double, dans index.astro et system-event.astro, avec les
  memes fonctions (centerOf, activeIndex, syncDots, applyArc) et un throttle
  rAF identique. Seuls changeaient les coefficients de courbure et le fait que
  l'accueil ne l'active que sous 1024px.
*/
export function carrousel(track: HTMLElement, o: OptionsCarrousel): void {
  const slides = [...track.querySelectorAll<HTMLElement>(o.slides)];
  if (!slides.length) return;
  const dots = o.dots ?? [];
  const mq = o.actifSi ? window.matchMedia(o.actifSi) : null;
  const actif = () => (mq ? mq.matches : true);

  const centreDe = (el: HTMLElement) => el.offsetLeft + el.offsetWidth / 2;

  const allerA = (i: number, doux: boolean) => {
    const el = slides[i];
    if (!el) return;
    let t = el.offsetLeft - (track.clientWidth - el.offsetWidth) / 2;
    t = Math.max(0, Math.min(t, track.scrollWidth - track.clientWidth));
    track.scrollTo({ left: t, behavior: doux ? 'smooth' : 'auto' });
  };

  const indexActif = () => {
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    let bd = Infinity;
    slides.forEach((el, i) => {
      const d = Math.abs(centreDe(el) - mid);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return best;
  };

  const syncDots = () => {
    const a = indexActif();
    dots.forEach((d, i) => {
      const on = i === a;
      if (o.classeDotActive) d.classList.toggle(o.classeDotActive, on);
      if (on) d.setAttribute('aria-current', 'true');
      else d.removeAttribute('aria-current');
    });
  };

  const appliquerArc = () => {
    if (!o.arc || mouvementReduit() || !actif()) {
      slides.forEach((s) => {
        s.style.transform = '';
      });
      return;
    }
    const { y, deg, scale } = o.arc;
    const mid = track.scrollLeft + track.clientWidth / 2;
    slides.forEach((el) => {
      let d = (centreDe(el) - mid) / track.clientWidth;
      d = Math.max(-1, Math.min(1, d));
      el.style.transform =
        `translateY(${(Math.abs(d) * y).toFixed(1)}px)` +
        ` rotate(${(d * deg).toFixed(2)}deg)` +
        ` scale(${(1 - Math.abs(d) * scale).toFixed(3)})`;
    });
  };

  /*
    Le snap doit etre neutralise pendant le positionnement initial. Avec
    scroll-snap-type:x mandatory, le navigateur re-aligne le conteneur apres la
    mise en page et ramene a la premiere vignette : un scrollLeft pose avant ce
    re-snap est silencieusement annule. Les deux carrousels du site sont en snap
    obligatoire, celui de l'accueil comme celui de /system-event.
  */
  const ouvrirSur = (i: number) => {
    track.style.scrollSnapType = 'none';
    allerA(i, false);
    /*
      Le retablissement passe par requestAnimationFrame, qui est suspendu tant
      que l'onglet est en arriere-plan : une page ouverte en nouvel onglet
      resterait alors sans snap une fois revenue au premier plan, le style
      inline n'ayant jamais ete vide. D'ou le repli sur setTimeout, lui non
      suspendu, et le verrou pour que le premier des deux fasse le travail.
    */
    let fait = false;
    const retablir = () => {
      if (fait) return;
      fait = true;
      /* on vide le style inline plutot que de restaurer une valeur memorisee :
         deux appels concurrents memoriseraient 'none' et le figeraient */
      track.style.scrollSnapType = '';
      syncDots();
      appliquerArc();
    };
    requestAnimationFrame(retablir);
    setTimeout(retablir, 100);
  };

  dots.forEach((d, i) => d.addEventListener('click', () => allerA(i, true)));

  let raf = 0;
  track.addEventListener('scroll', () => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      syncDots();
      appliquerArc();
    });
  });

  const initialiser = () => {
    if (!actif()) {
      slides.forEach((s) => {
        s.style.transform = '';
      });
      return;
    }
    ouvrirSur(o.depart ?? 0);
  };

  if (mq) {
    /* le passage desktop <-> carrousel doit reinitialiser le centrage */
    if (mq.addEventListener) mq.addEventListener('change', initialiser);
    else (mq as MediaQueryList).addListener(initialiser);
  }

  syncDots();
  appliquerArc();
  initialiser();
  /* si 'load' est deja passe, l'ecouteur ne partirait jamais */
  if (document.readyState !== 'complete') window.addEventListener('load', initialiser);
}
