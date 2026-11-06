import { mouvementReduit } from './motion';

/*
  LES PILES DE PLANCHES TOURNENT D'ELLES-MEMES.

  Le script ne pose qu'une chose : `--d`, la profondeur de chaque carte, et
  `--x`, qui vaut 1 pour celle qui attend dehors. Le reste - decalage, echelle,
  inclinaison, cote d'empilement - est du CSS. Ecrire les pixels ici aurait rendu
  la pile impossible a retoucher sans relire du JS.

  ELLES NE TOURNENT QUE VISIBLES. Un setInterval laisse a demeure ferait
  travailler deux piles en permanence. L'observateur coupe le minuteur des que la
  pile sort du champ et le relance en revenant.

  RIEN SOUS MOUVEMENT REDUIT, NI SOUS LE PALIER MOBILE : le CSS y remet la pile
  a plat, en colonne, et une rotation par-dessus n'aurait plus rien a faire
  tourner. L'opacite passe par une CLASSE et non par `style.opacity` - en inline
  elle aurait gagne contre la requete media qui remet les sept planches
  visibles, et quatre d'entre elles seraient restees invisibles en colonne.
*/
const PROFONDEUR_VISIBLE = 2;
const TOUR = 2600;
/*
  DELAI AVANT LE PREMIER TOUR, et il ne vaut pas TOUR. Un setInterval nu ne se
  declenche qu'au bout d'une periode : la pile resterait immobile 2,6s apres
  etre apparue, le temps qu'un tour entier s'ecoule dans le vide. A l'ecran,
  l'animation semble se declencher trop tard - elle ne se declenche pas du tout,
  elle attend. D'ou une amorce courte, juste assez pour que la premiere planche
  parte APRES avoir ete vue immobile.
*/
const AMORCE = 700;

export function initPiles(): void {
  const piles = document.querySelectorAll<HTMLElement>('.pilep');
  if (!piles.length) return;
  if (mouvementReduit()) return;
  if (!window.matchMedia('(min-width: 861px)').matches) return;

  piles.forEach((pile) => {
    const cartes = [...pile.querySelectorAll<HTMLElement>('.pilep__carte')];
    if (cartes.length < 2) return;
    let devant = 0;

    const poser = () => {
      cartes.forEach((carte, i) => {
        /*
          `devant - i` ET NON `i - devant` : c'est ce qui met la pile dans le bon
          sens. Avec la soustraction inverse, la carte rangee hors cadre serait
          celle qui vient de QUITTER le devant - les planches sortiraient sur le
          cote au lieu d'y entrer, exactement l'inverse du geste voulu.
        */
        const d = (devant - i + cartes.length) % cartes.length;
        /* la plus profonde est la PROCHAINE a entrer : on la range hors cadre du
           cote de sa colonne, pour qu'elle ait le chemin a parcourir quand son
           tour vient. Les autres retirees s'effacent sur place. */
        const enAttente = d === cartes.length - 1;
        /*
          La carte en attente porte --d:0 et non sa profondeur reelle. Le
          decalage de profondeur est le signe de l'EMPILEMENT, et elle n'est pas
          dans la pile - elle attend dehors. Lui laisser sa profondeur la
          remonterait, ce qui annulerait la chute de l'arc et la ferait arriver
          par le haut. Sa pose vient donc entierement de --x.
        */
        carte.style.setProperty('--d', enAttente ? '0' : String(Math.min(d, PROFONDEUR_VISIBLE + 1)));
        carte.style.setProperty('--x', enAttente ? '1' : '0');
        carte.classList.toggle('pilep__carte--loin', d > PROFONDEUR_VISIBLE);
        carte.style.zIndex = String(cartes.length - d);
      });
    };
    poser();

    const tourner = () => {
      devant = (devant + 1) % cartes.length;
      poser();
    };

    let minuteur: ReturnType<typeof setInterval> | undefined;
    let amorce: ReturnType<typeof setTimeout> | undefined;
    new IntersectionObserver(
      ([e]) => {
        clearInterval(minuteur);
        clearTimeout(amorce);
        if (!e.isIntersecting) return;
        amorce = setTimeout(() => {
          tourner();
          minuteur = setInterval(tourner, TOUR);
        }, AMORCE);
      },
      /* `threshold: 0` : la pile fait plusieurs centaines de pixels de haut,
         exiger le quart imposerait d'en faire defiler autant de plus avant que
         le minuteur ne s'arme. */
      { threshold: 0 },
    ).observe(pile);
  });
}
