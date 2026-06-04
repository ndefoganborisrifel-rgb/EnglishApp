/* ============================================================
   main.js — Navigation, en-tête/pied de page partagés,
   menu mobile et gestion de la progression (localStorage).
   Chargé sur TOUTES les pages.
   ============================================================ */
(function () {
  'use strict';

  /* Préfixe vers la racine du site, défini par <body data-root="../../">.
     Permet d'utiliser le même header/footer sur toutes les pages,
     quel que soit le niveau de dossier. */
  var ROOT = (document.body && document.body.dataset.root) || '';

  /* ---------------------------------------------------------
     1. PROGRESSION (localStorage)
     Structure stockée :
     {
       "a1-present-simple": { done: true, score: 8, total: 10 },
       ...
     }
     --------------------------------------------------------- */
  var STORAGE_KEY = 'englishapp.progress.v1';

  var Progress = {
    _read: function () {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      } catch (e) {
        return {};
      }
    },
    _write: function (data) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
      catch (e) { /* localStorage indisponible : on ignore silencieusement */ }
    },
    /* Enregistre le meilleur score obtenu pour un chapitre/exercice */
    saveScore: function (id, score, total) {
      var data = this._read();
      var prev = data[id] || {};
      var best = Math.max(prev.score || 0, score);
      data[id] = {
        done: prev.done || false,
        score: best,
        total: total,
        lastScore: score,
        updated: Date.now()
      };
      this._write(data);
      this._broadcast();
    },
    markDone: function (id, done) {
      var data = this._read();
      data[id] = data[id] || { score: 0, total: 0 };
      data[id].done = (done !== false);
      data[id].updated = Date.now();
      this._write(data);
      this._broadcast();
    },
    get: function (id) { return this._read()[id] || null; },
    isDone: function (id) { var e = this._read()[id]; return !!(e && e.done); },
    all: function () { return this._read(); },
    reset: function () { this._write({}); this._broadcast(); },
    /* Statistiques globales ou filtrées par préfixe (ex: "a1-") */
    stats: function (prefix) {
      var data = this._read();
      var done = 0, totalChapters = 0, score = 0, scoreMax = 0;
      Object.keys(data).forEach(function (id) {
        if (prefix && id.indexOf(prefix) !== 0) return;
        var e = data[id];
        totalChapters++;
        if (e.done) done++;
        score += e.score || 0;
        scoreMax += e.total || 0;
      });
      return { done: done, tracked: totalChapters, score: score, scoreMax: scoreMax };
    },
    _broadcast: function () {
      document.dispatchEvent(new CustomEvent('progress:update'));
    }
  };
  window.Progress = Progress;

  /* ---------------------------------------------------------
     2. EN-TÊTE PARTAGÉE (navigation)
     --------------------------------------------------------- */
  function buildHeader() {
    var host = document.querySelector('[data-nav]');
    if (!host) return;
    var current = document.body.dataset.page || '';
    var links = [
      { href: ROOT + 'index.html', key: 'home', label: 'Accueil' },
      { href: ROOT + 'niveaux/a1/index.html', key: 'a1', label: 'A1' },
      { href: ROOT + 'niveaux/a2/index.html', key: 'a2', label: 'A2' },
      { href: ROOT + 'niveaux/b1/index.html', key: 'b1', label: 'B1' },
      { href: ROOT + 'niveaux/b2/index.html', key: 'b2', label: 'B2' },
      { href: ROOT + 'writing/index.html', key: 'writing', label: 'Expression écrite' },
      { href: ROOT + 'reading/index.html', key: 'reading', label: 'Compréhension' },
      { href: ROOT + 'speaking/index.html', key: 'speaking', label: 'Speaking' }
    ];
    var lis = links.map(function (l) {
      var active = (l.key === current) ? ' class="is-active"' : '';
      return '<li><a href="' + l.href + '"' + active + '>' + l.label + '</a></li>';
    }).join('');

    var iconMenu = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
    var iconClose = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    host.innerHTML =
      '<div class="nav">' +
        '<a class="nav__brand" href="' + ROOT + 'index.html">' +
          '<span class="nav__logo">EN</span><span>English&nbsp;Class</span>' +
        '</a>' +
        '<button class="nav__toggle" aria-label="Menu" aria-expanded="false">' + iconMenu + '</button>' +
        '<ul class="nav__links">' + lis + '</ul>' +
      '</div>';

    var toggle = host.querySelector('.nav__toggle');
    var menu = host.querySelector('.nav__links');
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.innerHTML = open ? iconClose : iconMenu;
    });
    document.addEventListener('click', function (e) {
      if (menu.classList.contains('is-open') && !host.contains(e.target)) {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.innerHTML = iconMenu;
      }
    });
  }

  /* ---------------------------------------------------------
     3. PIED DE PAGE PARTAGÉ
     --------------------------------------------------------- */
  function buildFooter() {
    var host = document.querySelector('[data-footer]');
    if (!host) return;
    host.innerHTML =
      '<div class="site-footer__inner">' +
        '<div>' +
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">' +
            '<span style="width:34px;height:34px;background:linear-gradient(135deg,#6366f1,#4338ca);color:#fff;border-radius:9px;display:grid;place-items:center;font-weight:800;font-size:.95rem;flex-shrink:0">EN</span>' +
            '<span style="font-weight:800;color:#fff;font-size:1.05rem">English Class</span>' +
          '</div>' +
          '<p style="max-width:300px;font-size:0.875rem;line-height:1.6">Plateforme d\'apprentissage de l\'anglais pour francophones, du niveau A1 au B2. Cours, exemples et exercices auto-corrigés.</p>' +
        '</div>' +
        '<div>' +
          '<h4>Niveaux</h4>' +
          '<ul>' +
            '<li><a href="' + ROOT + 'niveaux/a1/index.html">A1 — Les bases</a></li>' +
            '<li><a href="' + ROOT + 'niveaux/a2/index.html">A2 — Construire des phrases</a></li>' +
            '<li><a href="' + ROOT + 'niveaux/b1/index.html">B1 — Aller plus loin</a></li>' +
            '<li><a href="' + ROOT + 'niveaux/b2/index.html">B2 — Maîtrise</a></li>' +
          '</ul>' +
        '</div>' +
        '<div>' +
          '<h4>Modules</h4>' +
          '<ul>' +
            '<li><a href="' + ROOT + 'writing/index.html">✍️ Expression écrite</a></li>' +
            '<li><a href="' + ROOT + 'reading/index.html">📖 Compréhension écrite</a></li>' +
            '<li><a href="' + ROOT + 'speaking/index.html">🗣️ Speaking</a></li>' +
          '</ul>' +
          '<h4 style="margin-top:1rem">Progression</h4>' +
          '<ul>' +
            '<li><a href="' + ROOT + 'index.html#niveaux">Tous les niveaux</a></li>' +
          '</ul>' +
        '</div>' +
      '</div>' +
      '<div class="site-footer__copy">' +
        '<span>© 2025 English Class · Tous droits réservés</span>' +
        '<span>Plateforme 100 % gratuite · Aucune inscription requise</span>' +
      '</div>';
  }

  /* ---------------------------------------------------------
     4. INDICATEURS DE PROGRESSION sur la page
     - Tout élément [data-stat="..."] est rempli automatiquement.
     - Les barres [data-progress-bar="prefix"] sont mises à jour.
     - Les liens de chapitre [data-chapter="id"] reçoivent un statut.
     --------------------------------------------------------- */
  function refreshProgressUI() {
    /* Statistiques textuelles */
    document.querySelectorAll('[data-stat]').forEach(function (el) {
      var spec = el.dataset.stat.split(':'); // ex "done:a1-"  ou  "done"
      var metric = spec[0];
      var prefix = spec[1] || '';
      var s = Progress.stats(prefix);
      var value = '';
      if (metric === 'done') value = s.done;
      else if (metric === 'tracked') value = s.tracked;
      else if (metric === 'score') value = s.score;
      else if (metric === 'scoreMax') value = s.scoreMax;
      else if (metric === 'percent') {
        var total = parseInt(el.dataset.total || '0', 10);
        value = total ? Math.round((s.done / total) * 100) + '%' : '0%';
      }
      el.textContent = value;
    });

    /* Barres de progression : data-progress-bar="prefix" data-total="11" */
    document.querySelectorAll('[data-progress-bar]').forEach(function (bar) {
      var prefix = bar.dataset.progressBar;
      var total = parseInt(bar.dataset.total || '0', 10);
      var s = Progress.stats(prefix);
      var pct = total ? Math.min(100, Math.round((s.done / total) * 100)) : 0;
      var fill = bar.querySelector('.progress-bar__fill');
      if (fill) fill.style.width = pct + '%';
      var label = bar.parentElement && bar.parentElement.querySelector('[data-progress-label]');
      if (label) label.innerHTML = '<b>' + s.done + '</b> / ' + total + ' chapitres';
    });

    /* Liens de chapitres : statut fait/à faire */
    document.querySelectorAll('[data-chapter]').forEach(function (link) {
      var id = link.dataset.chapter;
      var entry = Progress.get(id);
      var status = link.querySelector('.chapter-link__status');
      if (entry && entry.done) {
        link.classList.add('is-done');
        if (status) status.textContent = '✓';
        if (status) status.title = 'Chapitre terminé';
      } else {
        link.classList.remove('is-done');
        if (status) status.textContent = '○';
      }
      var sc = link.querySelector('[data-chapter-score]');
      if (sc && entry && entry.total) sc.textContent = 'Score : ' + entry.score + '/' + entry.total;
    });
  }

  /* ---------------------------------------------------------
     5. Bouton "Réinitialiser ma progression"
     --------------------------------------------------------- */
  function bindReset() {
    document.querySelectorAll('[data-reset-progress]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (confirm('Effacer toute votre progression (chapitres et scores) ?')) {
          Progress.reset();
        }
      });
    });
  }

  /* ---------------------------------------------------------
     6. Initialisation
     --------------------------------------------------------- */
  function init() {
    buildHeader();
    buildFooter();
    bindReset();
    refreshProgressUI();
    document.addEventListener('progress:update', refreshProgressUI);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
