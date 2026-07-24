import { mouvementReduit } from './motion';

/*
  Fondu enchaine entre plusieurs images superposees - le faire-part de
  /system-event, qui cycle sur ses trois etats.

  Le minuteur ne tourne que lorsque le bloc est visible : sinon il consommerait
  du temps de rendu en continu sur une page longue. C'est aussi ce qui explique
  qu'il n'y ait pas d'animation si l'on ne descend jamais jusqu'a lui.
*/
export function fonduEnchaine(stage: HTMLElement, sel: string, intervalle = 2200): void {
  if (mouvementReduit()) return;
  const frames = [...stage.querySelectorAll<HTMLElement>(sel)];
  if (frames.length < 2) return;

  let i = 0;
  let timer: ReturnType<typeof setInterval> | null = null;

  const suivant = () => {
    frames[i].classList.remove('is-on');
    i = (i + 1) % frames.length;
    frames[i].classList.add('is-on');
  };

  if (!('IntersectionObserver' in window)) {
    timer = setInterval(suivant, intervalle);
    return;
  }

  new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (e.isIntersecting && !timer) timer = setInterval(suivant, intervalle);
        else if (!e.isIntersecting && timer) {
          clearInterval(timer);
          timer = null;
        }
      }),
    { threshold: 0.25 },
  ).observe(stage);
}
