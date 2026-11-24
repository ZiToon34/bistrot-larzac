# Site du Bistrot Larzac (site sur mesure Booking A Table)

Site statique (HTML/CSS/JS, sans build) qui reprend le design d'origine du site RestoPro.
Ses contenus se modifient depuis **Mon site** dans Booking A Table (format « site sur mesure »).

## Dossiers

| Élément | Rôle |
|---|---|
| `site/` | Le site publié (dossier racine du projet Vercel) |
| `site/js/cms.js` | Lit le contenu dans Booking A Table et met la page à jour |
| `site/vercel.json` | Adresses propres, redirections des anciennes adresses RestoPro, sécurité |
| `content.json` | Structure + contenu à importer une fois dans Booking A Table (Plateforme) |
| `telecharger-photos.ps1` | Télécharge les photos d'origine dans `site/images/` |

## Liens vers Booking A Table

- Réservation : `https://reserver.bookatable.fr/le-bistrot-larzac`
- Repas de groupe : `https://reserver.bookatable.fr/le-bistrot-larzac/privatisation`

Si l'adresse de réservation du restaurant change, remplacer `le-bistrot-larzac` dans :
`site/js/cms.js` (CONFIG.slug), `site/vercel.json` et les pages HTML.

## Contenu

Les pages HTML contiennent déjà les textes (Google les lit directement). Au chargement, `cms.js`
appelle `GET /api/public/sites/custom?slug=le-bistrot-larzac` et remplace ce que le restaurateur a modifié.
Si l'API ne répond pas (mise en veille de Render), la page garde ses textes.

Photos : un nom de fichier (`salle.jpg`) = photo du dossier `site/images/` ;
une adresse `https://res.cloudinary.com/...` = photo de la photothèque Booking A Table.
