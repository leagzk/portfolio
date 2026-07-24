/*
  Service d'image : le service sharp d'Astro, plus la conservation des metadonnees.

  POURQUOI
  Les photos de /system-event portent un copyright XMP - "Madeleine Photographe"
  pour les photos de l'evenement, "Lea Giezek" pour les pages de specification.
  Sharp supprime toutes les metadonnees par defaut, et le service d'Astro
  n'appelle jamais keepMetadata() : passer ces images par astro:assets effacerait
  donc l'attribution de la photographe. Mesure faite sur identity-dresscode.webp :
  113 Ko sans metadonnees, 115 Ko avec. Le credit coute 2 Ko, soit 1,8 %.

  COMMENT
  On ne forke pas les 90 lignes du service. On rejoue le chemin nominal en y
  ajoutant keepMetadata(), et tout le reste - autres hooks, cas particuliers,
  erreurs - delegue au service d'origine. Ce qu'on reecrit tient en une trentaine
  de lignes, ce qui limite ce qu'il faudra relire a chaque montee de version
  majeure d'Astro.

  A VERIFIER APRES UN `npx @astrojs/upgrade`
  Que astro/assets/services/sharp exporte toujours resolveSharpEncoderOptions,
  et que la chaine sharp ci-dessous correspond toujours a la sienne
  (node_modules/astro/dist/assets/services/sharp.js, fonction transform).
*/
import sharp from 'sharp';
import sharpService, { resolveSharpEncoderOptions } from 'astro/assets/services/sharp';

/* meme table que le service d'origine : les noms CSS ne sont pas ceux de sharp */
const fitMap = {
  fill: 'fill',
  contain: 'inside',
  cover: 'cover',
  none: 'outside',
  'scale-down': 'inside',
  outside: 'outside',
  inside: 'inside',
};

export default {
  ...sharpService,

  async transform(inputBuffer, transform, config) {
    const meta = await sharp(inputBuffer)
      .metadata()
      .catch(() => null);

    const sourceFormat = meta?.format;
    const outputFormat = transform.format ?? sourceFormat;

    /*
      Cas particuliers - SVG, format illisible, sortie inconnue. On les laisse au
      service d'origine plutot que d'en recopier la gestion : il porte les bons
      messages d'erreur et les garde-fous (dangerouslyProcessSVG notamment).
    */
    if (!sourceFormat || sourceFormat === 'svg' || outputFormat === 'svg' || !outputFormat) {
      return sharpService.transform(inputBuffer, transform, config);
    }

    try {
      const serviceConfig = config.service.config ?? {};
      const kernel = serviceConfig.kernel;

      const result = sharp(inputBuffer, {
        failOn: 'none',
        pages: -1,
        limitInputPixels: serviceConfig.limitInputPixels,
      });

      result.rotate();
      result.keepMetadata(); // <- la seule difference avec le service d'Astro

      if (transform.width && transform.height) {
        result.resize({
          width: Math.round(transform.width),
          height: Math.round(transform.height),
          kernel,
          fit: transform.fit ? (fitMap[transform.fit] ?? 'inside') : undefined,
          position: transform.position,
          withoutEnlargement: true,
        });
      } else if (transform.height && !transform.width) {
        result.resize({ height: Math.round(transform.height), withoutEnlargement: true, kernel });
      } else if (transform.width) {
        result.resize({ width: Math.round(transform.width), withoutEnlargement: true, kernel });
      }

      if (transform.background) {
        result.flatten({ background: transform.background });
      }

      const encoderOptions = resolveSharpEncoderOptions(
        { format: outputFormat, quality: transform.quality },
        sourceFormat,
        serviceConfig,
      );

      if (outputFormat === 'webp') result.webp(encoderOptions);
      else if (outputFormat === 'png') result.png(encoderOptions);
      else if (outputFormat === 'avif') result.avif(encoderOptions);
      else if (outputFormat === 'jpeg' || outputFormat === 'jpg') result.jpeg(encoderOptions);
      else result.toFormat(outputFormat, encoderOptions);

      const { data, info } = await result.toBuffer({ resolveWithObject: true });

      /* meme precaution que le service d'origine : un SharedArrayBuffer ne peut pas etre transfere tel quel */
      const needsCopy = 'buffer' in data && data.buffer instanceof SharedArrayBuffer;
      return { data: needsCopy ? new Uint8Array(data) : data, format: info.format };
    } catch {
      /* jamais casser un build pour une metadonnee : on retombe sur le service d'Astro */
      return sharpService.transform(inputBuffer, transform, config);
    }
  },
};
