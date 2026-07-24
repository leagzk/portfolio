import { mouvementReduit } from './motion';

/*
  Ecran de chargement de l'accueil : le piment quitte le centre pour rejoindre
  sa pastille en haut a droite, puis le voile s'efface.

  Trois sorties possibles, volontairement redondantes : la fin de la transition,
  un filet de securite a 2600 ms, et le cas ou la pastille cible n'existe pas.
  Un loader qui ne se retire pas rend le site inutilisable - mieux vaut trois
  chemins qu'un seul elegant.
*/
export function initLoader(): void {
  const loaderEl = document.getElementById('loader');
  if (!loaderEl) return;

  if (mouvementReduit()) {
    loaderEl.style.display = 'none';
    return;
  }

  const fly = document.getElementById('fly');
  const panel = loaderEl.querySelector<HTMLElement>('.loader__panel');
  const badge = document.querySelector<HTMLElement>('.banner__pepper');
  let done = false;

  const finir = () => {
    if (done) return;
    done = true;
    if (badge) badge.style.opacity = '1';
    loaderEl.style.display = 'none';
  };

  setTimeout(() => {
    if (!badge || !fly || !panel) {
      if (panel) panel.style.opacity = '0';
      setTimeout(finir, 600);
      return;
    }
    const t = badge.getBoundingClientRect();
    const f = fly.getBoundingClientRect();
    const dx = t.left + t.width / 2 - (f.left + f.width / 2);
    const dy = t.top + t.height / 2 - (f.top + f.height / 2);
    badge.style.opacity = '0';
    panel.style.opacity = '0';
    fly.style.transform =
      `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${t.width / f.width})`;
  }, 1150);

  fly?.addEventListener('transitionend', (e) => {
    if ((e as TransitionEvent).propertyName === 'transform') finir();
  });
  setTimeout(finir, 2600);
}
