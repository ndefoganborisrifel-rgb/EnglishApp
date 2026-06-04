# English Class — Plateforme d'apprentissage de l'anglais (A1 → B2)

Site web pédagogique **100 % statique** (HTML5 + CSS3 + JavaScript vanilla, sans
aucune dépendance ni build) destiné à des **apprenants francophones**. Les explications
sont en français, les exemples en anglais (avec traduction). Conçu pour l'enseignement
en classe **et** le travail en autonomie.

## ✨ Fonctionnalités

- **4 niveaux** complets (A1, A2, B1, B2) + 2 modules (**Writing**, **Reading**).
- **49 chapitres** avec, pour chacun : règle expliquée en français, exemples EN/FR,
  tableaux récapitulatifs, erreurs fréquentes, exercices guidés et exercices autonomes.
- **Correction automatique** en JavaScript : feedback immédiat, affichage des bonnes
  réponses et **score** par exercice.
- **6 types d'exercices** : QCM, texte à trous, association, réécriture, conjugaison,
  mini-quiz de fin de chapitre.
- **Sauvegarde de la progression** via `localStorage` (chapitres terminés + meilleurs scores).
- **Design responsive** unique (un seul design system) — impeccable sur mobile et ordinateur.

## 🚀 Lancer le site

Aucune installation, aucun serveur requis :

1. Ouvrez simplement **`index.html`** dans n'importe quel navigateur (double-clic).
2. Naviguez via le menu en haut ou les cartes de la page d'accueil.

> Astuce : pour un confort optimal en classe, vous pouvez aussi servir le dossier avec
> `python3 -m http.server` puis ouvrir `http://localhost:8000`, mais ce n'est pas nécessaire.

La progression est enregistrée localement dans le navigateur. Le bouton
**« Réinitialiser ma progression »** (page d'accueil) efface les données.

## 🗂️ Arborescence

```
EnglishApp/
├── index.html                  Page d'accueil + tableau de bord de progression
├── css/
│   └── style.css               Design system commun (couleurs, typo, composants)
├── js/
│   ├── main.js                 Navigation, header/footer partagés, progression (localStorage)
│   └── exercises.js            Moteur d'exercices réutilisable + correction automatique
├── niveaux/
│   ├── a1/  (sommaire + 12 chapitres)   Les bases
│   ├── a2/  (sommaire +  9 chapitres)   Construire des phrases
│   ├── b1/  (sommaire +  9 chapitres)   Aller plus loin
│   └── b2/  (sommaire +  8 chapitres)   Maîtrise
├── writing/ (sommaire +  7 fiches)      Expression écrite
└── reading/ (sommaire +  4 textes)      Compréhension écrite
```

### Programme

- **A1** : alphabet & sons · nombres/heure/dates · pronoms sujets · to be · to have ·
  articles · pluriel · this/that · présent simple · there is/are · questions · vocabulaire.
- **A2** : présent continu · passé simple (+ verbes irréguliers) · passé continu · futur ·
  comparatifs/superlatifs · adverbes de fréquence · quantité · modaux · pronoms compléments.
- **B1** : present perfect · past perfect · pronoms relatifs · question tags ·
  discours indirect · voix passive · conditionnels (0/1/2) · phrasal verbs · gérondif/infinitif.
- **B2** : conditionnels (3 & mixtes) · passif avancé · discours indirect avancé ·
  wish/if only · causatif · relatives · connecteurs logiques · idiomes.
- **Writing** : phrase→paragraphe · article · discours · lettre formelle · lettre informelle ·
  essai · email.
- **Reading** : textes gradués A1 → B2 + questions de compréhension.

## 🧩 Ajouter / modifier un exercice

Chaque chapitre se termine par un appel à `EnglishApp.initChapter({...})`. Exemple :

```js
EnglishApp.initChapter({
  id: 'a1-present-simple',         // identifiant unique (sert à la progression)
  exercises: [
    { type: 'qcm', title: 'Exercice 1', instructions: '...',
      items: [ { q: 'She ___ tea.', options: ['drink','drinks','drinking'], answer: 1, explain: '3e pers. + s' } ] },
    { type: 'fill', title: 'Exercice 2', instructions: '...',
      items: [ { text: 'I [[work|m working]] every day.', hint: 'présent simple' } ] },
    { type: 'match', title: 'Exercice 3', instructions: '...',
      left: ['dog','cat'], right: ['chien','chat'], answer: [0,1] },
    { type: 'rewrite', title: 'Exercice 4', instructions: '...',
      items: [ { q: 'Mettez à la forme négative : She works.', accept: ["She doesn't work","She does not work"] } ] },
    { type: 'quiz', title: 'Mini-quiz', items: [ /* format QCM */ ] }
  ]
});
```

Types disponibles : `qcm`, `fill`, `conjugate` (= fill), `match`, `rewrite`, `quiz`.
La comparaison des réponses libres est insensible à la casse, aux espaces multiples,
à la ponctuation finale et aux apostrophes ; les variantes acceptées se déclarent avec
`[[reponse|variante]]` (fill) ou via le tableau `accept` (rewrite).
