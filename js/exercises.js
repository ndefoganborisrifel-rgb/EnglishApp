/* ============================================================
   exercises.js — Moteur d'exercices réutilisable.
   Types pris en charge :
     - qcm       : questions à choix multiple
     - fill      : texte à trous (avec [[reponse|variante]] dans le texte)
     - conjugate : conjugaison (alias de fill, avec consigne dédiée)
     - match     : association (listes gauche/droite via menus déroulants)
     - rewrite   : réécriture de phrases (saisie libre, comparaison souple)
   Chaque exercice : feedback immédiat + bonnes réponses + score.
   La progression du chapitre est enregistrée via window.Progress.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Utilitaires ---------- */

  /* Normalisation pour comparer les réponses libres :
     minuscules, espaces réduits, apostrophes uniformisées,
     ponctuation finale ignorée. */
  function norm(s) {
    return String(s)
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[.!?;,]+$/, '');
  }

  function accepts(userValue, acceptList) {
    var u = norm(userValue);
    return acceptList.some(function (a) { return norm(a) === u; });
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* ============================================================
     RENDU PAR TYPE
     Chaque fonction renvoie { node, grade } où grade() renvoie
     { correct, total } et applique le feedback visuel.
     ============================================================ */

  /* ---- QCM ---- */
  function renderQCM(items) {
    var wrap = el('div');
    var state = items.map(function (item, i) {
      var block = el('div', 'ex-item');
      block.appendChild(el('div', 'ex-item__q',
        '<span class="num">' + (i + 1) + '.</span>' + esc(item.q)));
      var opts = el('div', 'qcm-options');
      var name = 'q' + i + '_' + Math.random().toString(36).slice(2, 7);
      item.options.forEach(function (opt, j) {
        var label = el('label', 'qcm-option');
        label.innerHTML =
          '<input type="radio" name="' + name + '" value="' + j + '">' +
          '<span>' + esc(opt) + '</span>';
        opts.appendChild(label);
      });
      block.appendChild(opts);
      var fb = el('div', 'ex-feedback');
      block.appendChild(fb);
      wrap.appendChild(block);
      return { item: item, opts: opts, fb: fb, name: name };
    });

    function grade() {
      var correct = 0;
      state.forEach(function (s) {
        var checked = s.opts.querySelector('input:checked');
        var labels = s.opts.querySelectorAll('.qcm-option');
        labels.forEach(function (l) { l.classList.remove('correct', 'wrong'); });
        labels[s.item.answer].classList.add('correct');
        if (checked) {
          var val = parseInt(checked.value, 10);
          if (val === s.item.answer) {
            correct++;
            s.fb.className = 'ex-feedback ok';
            s.fb.textContent = '✓ Correct !';
          } else {
            labels[val].classList.add('wrong');
            s.fb.className = 'ex-feedback ko';
            s.fb.textContent = '✗ Incorrect.';
          }
        } else {
          s.fb.className = 'ex-feedback ko';
          s.fb.textContent = '✗ Pas de réponse.';
        }
        if (s.item.explain) {
          s.fb.innerHTML += ' <span class="ex-solution">' + esc(s.item.explain) + '</span>';
        }
      });
      return { correct: correct, total: state.length };
    }
    return { node: wrap, grade: grade };
  }

  /* ---- FILL / CONJUGATE (texte à trous) ----
     Le texte contient des trous notés [[reponse|variante]].
     Chaque item : { text: '...', hint?: '...', prompt?: '...' } */
  function renderFill(items) {
    var wrap = el('div');
    var blanks = []; // tous les trous, pour la correction
    items.forEach(function (item, i) {
      var block = el('div', 'ex-item');
      var line = el('div', 'ex-item__q fill-text');
      var html = '<span class="num">' + (i + 1) + '.</span> ';
      if (item.prompt) html += '<em>' + esc(item.prompt) + '</em> — ';

      // Découpe le texte sur les [[...]]
      var parts = item.text.split(/(\[\[.*?\]\])/g);
      parts.forEach(function (part) {
        var m = part.match(/^\[\[(.*?)\]\]$/);
        if (m) {
          var answersList = m[1].split('|');
          var id = 'b' + blanks.length;
          var size = Math.max(6, answersList[0].length + 2);
          html += '<input class="ex-input" data-blank="' + id +
                  '" size="' + size + '" autocomplete="off" autocapitalize="off" spellcheck="false">';
          blanks.push({ id: id, accept: answersList });
        } else {
          html += esc(part);
        }
      });
      line.innerHTML = html;
      block.appendChild(line);
      if (item.hint) {
        block.appendChild(el('div', 'ex-solution', '💡 ' + esc(item.hint)));
      }
      var fb = el('div', 'ex-feedback');
      block.appendChild(fb);
      block._fb = fb;
      block._first = blanks.length ? 'b' + (blanks.length - 1) : null;
      wrap.appendChild(block);
    });

    function grade() {
      var correct = 0;
      blanks.forEach(function (b) {
        var input = wrap.querySelector('[data-blank="' + b.id + '"]');
        input.classList.remove('correct', 'wrong');
        if (accepts(input.value, b.accept)) {
          input.classList.add('correct');
          correct++;
        } else {
          input.classList.add('wrong');
          input.insertAdjacentHTML('afterend',
            '<span class="ex-solution"> → <b>' + esc(b.accept[0]) + '</b></span>');
        }
      });
      return { correct: correct, total: blanks.length };
    }
    return { node: wrap, grade: grade };
  }

  /* ---- MATCH (association via menus déroulants) ----
     item config global : { left:[...], right:[...], answer:[idx...] }
     answer[i] = index dans `right` correspondant à left[i]. */
  function renderMatch(cfg) {
    var wrap = el('div');
    var rows = [];
    // Options mélangées pour l'affichage mais valeurs = index d'origine
    var optionsHTML = '<option value="">— choisir —</option>' +
      cfg.right.map(function (r, idx) {
        return '<option value="' + idx + '">' + esc(r) + '</option>';
      }).join('');

    cfg.left.forEach(function (leftText, i) {
      var row = el('div', 'ex-item');
      var inner = el('div', 'match-row');
      inner.innerHTML =
        '<span class="match-term">' + esc(leftText) + '</span>' +
        '<select class="ex-input">' + optionsHTML + '</select>';
      row.appendChild(inner);
      var fb = el('div', 'ex-feedback');
      row.appendChild(fb);
      wrap.appendChild(row);
      rows.push({ select: inner.querySelector('select'), fb: fb, answer: cfg.answer[i], right: cfg.right });
    });

    function grade() {
      var correct = 0;
      rows.forEach(function (r) {
        r.select.classList.remove('correct', 'wrong');
        var val = r.select.value === '' ? -1 : parseInt(r.select.value, 10);
        if (val === r.answer) {
          correct++;
          r.select.classList.add('correct');
          r.fb.className = 'ex-feedback ok';
          r.fb.textContent = '✓';
        } else {
          r.select.classList.add('wrong');
          r.fb.className = 'ex-feedback ko';
          r.fb.innerHTML = '✗ → <b>' + esc(r.right[r.answer]) + '</b>';
        }
      });
      return { correct: correct, total: rows.length };
    }
    return { node: wrap, grade: grade };
  }

  /* ---- REWRITE (réécriture, saisie libre) ----
     item : { q:'consigne / phrase de départ', accept:[...] } */
  function renderRewrite(items) {
    var wrap = el('div');
    var state = items.map(function (item, i) {
      var block = el('div', 'ex-item');
      block.appendChild(el('div', 'ex-item__q',
        '<span class="num">' + (i + 1) + '.</span>' + esc(item.q)));
      var input = el('textarea', 'ex-input ex-input--block');
      input.rows = 2;
      input.setAttribute('autocomplete', 'off');
      input.placeholder = 'Votre réponse…';
      block.appendChild(input);
      var fb = el('div', 'ex-feedback');
      block.appendChild(fb);
      wrap.appendChild(block);
      return { item: item, input: input, fb: fb };
    });

    function grade() {
      var correct = 0;
      state.forEach(function (s) {
        s.input.classList.remove('correct', 'wrong');
        if (accepts(s.input.value, s.item.accept)) {
          correct++;
          s.input.classList.add('correct');
          s.fb.className = 'ex-feedback ok';
          s.fb.textContent = '✓ Correct !';
        } else {
          s.input.classList.add('wrong');
          s.fb.className = 'ex-feedback ko';
          s.fb.innerHTML = '✗ Réponse attendue : <b>' + esc(s.item.accept[0]) + '</b>';
        }
      });
      return { correct: correct, total: state.length };
    }
    return { node: wrap, grade: grade };
  }

  /* ============================================================
     Assemblage d'un exercice complet (carte + bouton Vérifier)
     ============================================================ */
  var TYPE_LABELS = {
    qcm: 'QCM', fill: 'Texte à trous', conjugate: 'Conjugaison',
    match: 'Association', rewrite: 'Réécriture', quiz: 'Mini-quiz'
  };

  function buildExercise(cfg, onGraded) {
    var card = el('section', 'exercise');
    var head = el('div', 'exercise__head');
    head.innerHTML =
      '<h3 class="exercise__title">' + esc(cfg.title || 'Exercice') + '</h3>' +
      '<span class="exercise__type">' + (TYPE_LABELS[cfg.type] || cfg.type) + '</span>';
    card.appendChild(head);
    if (cfg.instructions) {
      card.appendChild(el('p', 'exercise__instructions', esc(cfg.instructions)));
    }

    var rendered;
    if (cfg.type === 'qcm' || cfg.type === 'quiz') rendered = renderQCM(cfg.items);
    else if (cfg.type === 'fill' || cfg.type === 'conjugate') rendered = renderFill(cfg.items);
    else if (cfg.type === 'match') rendered = renderMatch(cfg);
    else if (cfg.type === 'rewrite') rendered = renderRewrite(cfg.items);
    else { rendered = { node: el('div', null, 'Type inconnu'), grade: function () { return { correct: 0, total: 0 }; } }; }

    card.appendChild(rendered.node);

    var actions = el('div', 'exercise__actions');
    var checkBtn = el('button', 'btn btn--primary', '✓ Vérifier');
    var retryBtn = el('button', 'btn btn--outline hidden', '↺ Recommencer');
    var scoreTag = el('span', 'exercise__score hidden');
    actions.appendChild(checkBtn);
    actions.appendChild(retryBtn);
    actions.appendChild(scoreTag);
    card.appendChild(actions);

    var graded = false;
    checkBtn.addEventListener('click', function () {
      if (graded) return;
      var res = rendered.grade();
      graded = true;
      var pct = res.total ? Math.round((res.correct / res.total) * 100) : 0;
      scoreTag.textContent = 'Score : ' + res.correct + '/' + res.total + ' (' + pct + '%)';
      scoreTag.classList.remove('hidden', 'good', 'bad');
      scoreTag.classList.add(pct >= 70 ? 'good' : 'bad');
      retryBtn.classList.remove('hidden');
      checkBtn.classList.add('hidden');
      // Désactive les saisies après correction
      card.querySelectorAll('input, select, textarea').forEach(function (f) { f.disabled = true; });
      onGraded(cfg, res);
    });

    retryBtn.addEventListener('click', function () {
      // Recrée l'exercice proprement
      var fresh = buildExercise(cfg, onGraded);
      card.replaceWith(fresh);
    });

    return card;
  }

  /* ============================================================
     API PUBLIQUE : initialisation d'un chapitre complet
     EnglishApp.initChapter({
       id: 'a1-...',
       exercises: [ {type, title, instructions, items|...}, ... ]
     });
     Rend tous les exercices dans #exercises, agrège le score,
     l'enregistre dans la progression et gère le bouton "terminé".
     ============================================================ */
  function initChapter(config) {
    var mount = document.getElementById('exercises');
    if (!mount) return;
    var id = config.id;
    var results = {}; // index -> {correct,total}

    config.exercises.forEach(function (cfg, idx) {
      var node = buildExercise(cfg, function (c, res) {
        results[idx] = res;
        saveAggregate();
      });
      mount.appendChild(node);
    });

    function aggregate() {
      var correct = 0, total = 0, doneEx = 0;
      Object.keys(results).forEach(function (k) {
        correct += results[k].correct;
        total += results[k].total;
        doneEx++;
      });
      return { correct: correct, total: total, doneEx: doneEx, totalEx: config.exercises.length };
    }

    function saveAggregate() {
      var a = aggregate();
      if (window.Progress) window.Progress.saveScore(id, a.correct, a.total);
      renderSummary();
    }

    /* Barre de synthèse + bouton "Marquer comme terminé" */
    var summary = document.getElementById('chapter-summary');
    function renderSummary() {
      if (!summary) return;
      var a = aggregate();
      var pct = a.total ? Math.round((a.correct / a.total) * 100) : 0;
      var done = window.Progress && window.Progress.isDone(id);
      summary.innerHTML =
        '<h3>📊 Votre progression dans ce chapitre</h3>' +
        '<p>Exercices corrigés : <b>' + a.doneEx + ' / ' + a.totalEx + '</b>' +
        (a.total ? ' — Score cumulé : <b>' + a.correct + ' / ' + a.total + ' (' + pct + '%)</b>' : '') +
        '</p>' +
        '<button class="btn ' + (done ? 'btn--outline' : 'btn--primary') + '" id="mark-done-btn">' +
          (done ? '✓ Chapitre marqué comme terminé' : 'Marquer ce chapitre comme terminé') +
        '</button>';
      var btn = document.getElementById('mark-done-btn');
      if (btn) btn.addEventListener('click', function () {
        window.Progress.markDone(id, !window.Progress.isDone(id));
        renderSummary();
      });
    }
    renderSummary();
  }

  /* Exposition publique */
  window.EnglishApp = window.EnglishApp || {};
  window.EnglishApp.initChapter = initChapter;
  window.EnglishApp.buildExercise = buildExercise; // utile pour usages ponctuels
})();
