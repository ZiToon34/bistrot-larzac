/* ==========================================================================
   Le Bistrot Larzac — contenu modifiable depuis Booking A Table (« Mon site »)

   Les pages HTML contiennent déjà tous les textes (bon pour Google et pour un
   affichage immédiat). Ce script va chercher le contenu enregistré dans Booking
   A Table et remplace ce qui a changé.

   Repères posés dans le HTML (toujours « rubrique.champ ») :
     data-cms="x.y"          texte simple
     data-cms-paras="x.y"    texte en paragraphes (un retour à la ligne = un paragraphe)
     data-cms-img="x.y"      photo <img>
     data-cms-bg="x.y"       photo de fond
     data-cms-galerie="x.y"  liste de photos
     data-cms-href="x.y"     lien (masqué si vide)
     data-cms-tel="x.y"      lien téléphone
     data-cms-show="x.y"     élément affiché seulement si le champ est vrai / non vide
     data-cms-horaires="x.y" liste des horaires
     data-cms-choix="x.y"    liste de choix du menu (entrées, plats, desserts)
     data-cms-carte="x.y"    plats à la carte, regroupés par rubrique
     data-cms-offres="x.y"   offres d'emploi
   ========================================================================== */

(function () {
  'use strict';

  /** Réglages du site : adresse de l'API et adresse du restaurant dans Booking A Table. */
  var CONFIG = {
    apiUrl: 'https://resacodex-api.onrender.com',
    slug: 'le-bistrot-larzac',
    cacheKey: 'bistrot-larzac-contenu',
  };

  // ---------------------------------------------------------------------------
  // Outils
  // ---------------------------------------------------------------------------

  /** Range le contenu sous la forme { "rubrique.champ": valeur } pour le retrouver vite. */
  function indexer(sections) {
    var index = {};
    (sections || []).forEach(function (section) {
      (section.fields || []).forEach(function (champ) {
        index[section.id + '.' + champ.id] = champ.value;
      });
    });
    return index;
  }

  /** Adresse d'une photo : nom de fichier du dossier /images ou adresse complète (photothèque). */
  function urlPhoto(valeur) {
    if (typeof valeur !== 'string' || !valeur) return '';
    if (/^https:\/\/[^\s"'()<>\\]+$/.test(valeur)) return valeur;
    if (/^[A-Za-z0-9._ -]+$/.test(valeur) && valeur.indexOf('..') === -1) return '/images/' + valeur;
    return '';
  }

  /** Vrai si une valeur est « remplie » (texte non vide, liste non vide, interrupteur activé). */
  function estRempli(valeur) {
    if (Array.isArray(valeur)) return valeur.length > 0;
    if (typeof valeur === 'boolean') return valeur;
    return valeur !== undefined && valeur !== null && String(valeur).trim() !== '';
  }

  /** Crée un élément avec une classe et un texte (jamais de HTML : le texte est sûr). */
  function creer(balise, classe, texte) {
    var el = document.createElement(balise);
    if (classe) el.className = classe;
    if (texte !== undefined && texte !== null) el.textContent = String(texte);
    return el;
  }

  /** Remplace le contenu d'un élément par des paragraphes (un par ligne non vide). */
  function paragraphes(el, texte) {
    el.textContent = '';
    String(texte || '')
      .split(/\n+/)
      .map(function (ligne) { return ligne.trim(); })
      .filter(Boolean)
      .forEach(function (ligne) { el.appendChild(creer('p', '', ligne)); });
  }

  /** Parcourt les éléments qui portent un attribut, et appelle la fonction si le champ existe. */
  function chaque(attribut, index, fonction) {
    document.querySelectorAll('[' + attribut + ']').forEach(function (el) {
      var cle = el.getAttribute(attribut);
      if (Object.prototype.hasOwnProperty.call(index, cle)) fonction(el, index[cle]);
    });
  }

  // ---------------------------------------------------------------------------
  // Rendus des listes
  // ---------------------------------------------------------------------------

  /** Horaires : « Lundi : Fermé ». */
  function rendreHoraires(el, lignes) {
    el.textContent = '';
    (lignes || []).forEach(function (ligne) {
      if (!ligne || !estRempli(ligne.label)) return;
      var li = creer('li');
      li.appendChild(creer('span', 'horaires__jour', ligne.label));
      li.appendChild(creer('span', '', ligne.valeur));
      el.appendChild(li);
    });
  }

  /** Choix du menu (entrées, plats, desserts). Le groupe entier est masqué si la liste est vide. */
  function rendreChoix(el, lignes) {
    el.textContent = '';
    var remplies = (lignes || []).filter(function (l) { return l && estRempli(l.label); });
    remplies.forEach(function (ligne) {
      var li = creer('li', '', ligne.label);
      if (estRempli(ligne.valeur)) {
        li.appendChild(document.createTextNode(' '));
        li.appendChild(creer('span', 'carte-menu__supplement', '(' + ligne.valeur + ')'));
      }
      el.appendChild(li);
    });
    var groupe = el.closest('.carte-menu__groupe');
    if (groupe) groupe.hidden = remplies.length === 0;
  }

  /** Plats à la carte : regroupés par rubrique, dans l'ordre où les rubriques apparaissent. */
  function rendreCarte(el, articles) {
    el.textContent = '';
    var rubriques = [];
    var parRubrique = {};
    (articles || []).forEach(function (article) {
      if (!article || !estRempli(article.nom)) return;
      var nom = estRempli(article.rubrique) ? String(article.rubrique).trim() : 'À la carte';
      if (!parRubrique[nom]) { parRubrique[nom] = []; rubriques.push(nom); }
      parRubrique[nom].push(article);
    });

    rubriques.forEach(function (nom) {
      var bloc = creer('section', 'carte-rubrique');
      bloc.appendChild(creer('h3', 'carte-rubrique__titre', nom));
      parRubrique[nom].forEach(function (article) {
        var ligneArticle = creer('div', 'carte-article');
        var ligne = creer('div', 'carte-article__ligne');
        ligne.appendChild(creer('span', 'carte-article__nom', article.nom));
        ligne.appendChild(creer('span', 'carte-article__points'));
        if (estRempli(article.prix)) ligne.appendChild(creer('span', 'carte-article__prix', article.prix));
        ligneArticle.appendChild(ligne);
        if (estRempli(article.description)) {
          ligneArticle.appendChild(creer('p', 'carte-article__desc', article.description));
        }
        bloc.appendChild(ligneArticle);
      });
      el.appendChild(bloc);
    });
  }

  /** Offres d'emploi : une carte par offre non masquée ; texte « aucune offre » sinon. */
  function rendreOffres(el, offres) {
    el.textContent = '';
    var visibles = (offres || []).filter(function (o) { return o && !o.masquee && estRempli(o.poste); });
    visibles.forEach(function (offre) {
      var carte = creer('article', 'offre');
      carte.appendChild(creer('h2', 'offre__poste', offre.poste));
      var infos = [offre.contrat, offre.periode].filter(estRempli).join(' — ');
      if (infos) carte.appendChild(creer('p', 'offre__infos', infos));
      if (estRempli(offre.description)) {
        var desc = creer('div', 'offre__desc');
        paragraphes(desc, offre.description);
        carte.appendChild(desc);
      }
      el.appendChild(carte);
    });
    var aucune = document.querySelector('[data-aucune-offre]');
    if (aucune) aucune.hidden = visibles.length > 0;
  }

  // ---------------------------------------------------------------------------
  // Application du contenu sur la page
  // ---------------------------------------------------------------------------

  /** Met à jour toute la page à partir du contenu (liste des rubriques). */
  function appliquer(sections) {
    var index = indexer(sections);

    chaque('data-cms', index, function (el, v) { el.textContent = v == null ? '' : String(v); });
    chaque('data-cms-paras', index, paragraphes);

    chaque('data-cms-img', index, function (el, v) {
      var url = urlPhoto(v);
      if (url) { el.src = url; el.hidden = false; } else { el.hidden = true; }
    });

    chaque('data-cms-bg', index, function (el, v) {
      var url = urlPhoto(v);
      el.style.backgroundImage = url ? 'url("' + url + '")' : 'none';
    });

    chaque('data-cms-galerie', index, function (el, v) {
      var liste = Array.isArray(v) ? v : (v ? [v] : []);
      var alt = el.getAttribute('data-alt') || '';
      el.textContent = '';
      liste.map(urlPhoto).filter(Boolean).forEach(function (url) {
        var img = creer('img');
        img.src = url;
        img.alt = alt;
        img.loading = 'lazy';
        el.appendChild(img);
      });
      el.hidden = el.children.length === 0;
    });

    chaque('data-cms-href', index, function (el, v) {
      var ok = typeof v === 'string' && /^https:\/\//.test(v);
      if (ok) el.href = v;
      el.hidden = !ok;
    });

    chaque('data-cms-tel', index, function (el, v) {
      var numero = String(v || '').replace(/[^\d+]/g, '');
      if (numero.charAt(0) === '0') numero = '+33' + numero.slice(1);
      el.href = 'tel:' + numero;
      if (!el.hasAttribute('data-garder-texte')) el.textContent = String(v || '');
      el.hidden = !numero;
    });

    chaque('data-cms-show', index, function (el, v) { el.hidden = !estRempli(v); });
    chaque('data-cms-horaires', index, rendreHoraires);
    chaque('data-cms-choix', index, rendreChoix);
    chaque('data-cms-carte', index, rendreCarte);
    chaque('data-cms-offres', index, rendreOffres);

    // Bouton « Envoyer ma candidature » : lien email construit à partir du champ.
    var email = index['emploi.email_cv'];
    document.querySelectorAll('[data-lien-cv]').forEach(function (el) {
      var ok = typeof email === 'string' && /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(email.trim());
      if (ok) el.href = 'mailto:' + email.trim() + '?subject=' + encodeURIComponent('Candidature');
      el.hidden = !ok;
    });

    preparerAnnonce(index);
  }

  /** Lit le dernier contenu gardé dans le navigateur (affichage instantané à la visite suivante). */
  function lireCache() {
    try {
      var brut = window.localStorage.getItem(CONFIG.cacheKey);
      return brut ? JSON.parse(brut) : null;
    } catch (e) {
      return null;
    }
  }

  /** Garde le contenu dans le navigateur. */
  function ecrireCache(sections) {
    try {
      window.localStorage.setItem(CONFIG.cacheKey, JSON.stringify(sections));
    } catch (e) { /* navigation privée : rien à faire */ }
  }

  /** Va chercher le contenu à jour dans Booking A Table. */
  function charger() {
    var cache = lireCache();
    if (cache) appliquer(cache);
    else preparerAnnonce({});

    var url = CONFIG.apiUrl + '/api/public/sites/custom?slug=' + encodeURIComponent(CONFIG.slug);
    fetch(url, { headers: { Accept: 'application/json' } })
      .then(function (reponse) { return reponse.ok ? reponse.json() : null; })
      .then(function (donnees) {
        var sections = donnees && donnees.site && donnees.site.sections;
        if (!Array.isArray(sections)) return;
        ecrireCache(sections);
        appliquer(sections);
      })
      .catch(function () { /* API injoignable : la page garde ses textes */ });
  }

  // ---------------------------------------------------------------------------
  // Comportements de la page
  // ---------------------------------------------------------------------------

  /** Affiche l'annonce une seule fois par visite, si elle est activée. */
  function preparerAnnonce(index) {
    var annonce = document.querySelector('[data-annonce]');
    if (!annonce) return;
    var active = index['bandeau.popup_visible'] === true;
    var dejaVue = false;
    try { dejaVue = window.sessionStorage.getItem('bistrot-annonce') === '1'; } catch (e) { /* ignoré */ }
    annonce.hidden = !active || dejaVue;
  }

  /** Ferme l'annonce et retient qu'elle a été vue pendant cette visite. */
  function fermerAnnonce() {
    var annonce = document.querySelector('[data-annonce]');
    if (annonce) annonce.hidden = true;
    try { window.sessionStorage.setItem('bistrot-annonce', '1'); } catch (e) { /* ignoré */ }
  }

  /** Menu mobile : ouvre / ferme la liste des liens. */
  function preparerMenu() {
    var bouton = document.querySelector('.nav__burger');
    var liens = document.querySelector('.nav__liens');
    if (!bouton || !liens) return;
    bouton.addEventListener('click', function () {
      var ouvert = liens.classList.toggle('est-ouvert');
      bouton.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
    });
  }

  /** En-tête : fond sombre dès que l'on fait défiler la page. */
  function preparerEntete() {
    var entete = document.querySelector('.entete');
    if (!entete) return;
    var maj = function () { entete.classList.toggle('est-defile', window.scrollY > 40); };
    window.addEventListener('scroll', maj, { passive: true });
    maj();
  }

  /** Carte Google : chargée seulement au clic (pas de cookie Google avant l'accord du visiteur). */
  function preparerCarte() {
    var bouton = document.querySelector('[data-afficher-carte]');
    if (!bouton) return;
    bouton.addEventListener('click', function () {
      var zone = bouton.closest('.carte-google');
      var recherche = (document.querySelector('[data-carte-recherche]') || {}).textContent || '';
      var iframe = document.createElement('iframe');
      iframe.title = 'Plan d’accès au Bistrot Larzac';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.src = 'https://www.google.com/maps?output=embed&q=' + encodeURIComponent(recherche.trim());
      zone.textContent = '';
      zone.appendChild(iframe);
    });
  }

  /** Année du copyright. */
  function preparerAnnee() {
    document.querySelectorAll('[data-annee]').forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /** Démarrage. */
  function demarrer() {
    preparerMenu();
    preparerEntete();
    preparerCarte();
    preparerAnnee();
    document.querySelectorAll('[data-fermer-annonce]').forEach(function (el) {
      el.addEventListener('click', fermerAnnonce);
    });
    charger();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();
})();
