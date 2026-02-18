Voici la **liste exacte des pages UI** + un **wireframe logique** (ce que chaque écran contient, quelles actions, et la navigation). C’est pensé **mobile-first**, très “user friendly”, **FR/EN**, avec **cookie httpOnly** (donc états “connecté/pas connecté” gérés côté app).

---

## Navigation globale (mobile-first)

### Mobile (bottom nav)

* **Home**
* **Learn**
* **Quiz**
* **Dashboard**
* **Profile**

### Desktop (sidebar)

* mêmes sections + espace pour filtres (langue, difficulté, etc.)

---

# 0) Layouts (gabarits)

## 0.1 PublicLayout

* Header minimal + bouton **Login**
* Sélecteur langue (FR/EN)
* Footer

## 0.2 AppLayout (auth requis)

* Top bar: logo + **Language switch** + avatar
* Mobile bottom nav
* Toast notifications
* Skeleton loading

---

# 1) Pages Auth (Public)

## 1.1 `/login`

**Wireframe**

* Titre: “Connexion”
* Champs:

  * Email
  * Mot de passe
* Boutons:

  * **Se connecter**
  * “Créer un compte”
* UX:

  * show/hide password
  * erreurs inline
  * loading state

## 1.2 `/register`

**Wireframe**

* Titre: “Créer un compte”
* Champs:

  * Prénom (optionnel)
  * Email
  * Mot de passe
  * Confirmer
* Checkbox: “J’accepte …” (optionnel)
* Bouton: **Créer mon compte**
* Link: “Déjà un compte ? Connexion”

## 1.3 `/forgot-password` *(optionnel v1.1)*

* Email
* “Envoyer lien”
* Message de confirmation générique

---

# 2) Onboarding (post-login)

## 2.1 `/onboarding`

**But** : rendre l’app “feel premium” dès le début.

**Wireframe (steps)**

* Step 1: Choisir langue **FR / EN**
* Step 2: Objectif (ex: “Passer l’exam en 4 semaines / 8 semaines / sans date”)
* Step 3: Niveau (Débutant / Intermédiaire)
* Step 4: Prefer: “QCM instant feedback” vs “mode examen”
* CTA: **Commencer**

(Stocker préférences utilisateur + set `LanguageContext`)

---

# 3) Home (App)

## 3.1 `/app` (Home)

**Wireframe**

* Header: “Bonjour, Amine” + mini-progress global (%)
* Cards rapides:

  * **Continuer** (dernier sous-objectif)
  * **Générer un QCM** (dernier sous-objectif)
  * **Revoir mes erreurs**
* Section “Weak areas” (3 sous-objectifs les plus faibles)
* Section “Streak / Today” (si tu fais de la révision journalière)

Actions:

* Tap sur card → navigue direct

---

# 4) Learn (Catalogue pédagogique)

## 4.1 `/learn`

**Wireframe**

* Search bar: “Rechercher un concept / sous-objectif”
* Tabs (ou accordéons):

  * Domaines (1.0 → 5.0)
* Chaque domaine = card avec:

  * Nom + weight %
  * progress bar
  * bouton “Voir”

## 4.2 `/learn/domain/:domainCode`

**Wireframe**

* Breadcrumb: Learn > Domain 1.0
* Header Domain:

  * Nom + % exam
  * progress domaine
* Liste des **Objectives** (cards):

  * Code (1.1) + titre
  * progress mini
  * bouton “Ouvrir”

## 4.3 `/learn/objective/:objectiveCode`

**Wireframe**

* Header objective:

  * Code + title
  * progress objective
* Liste des **Sub-objectives**:

  * code (1.1.1), titre
  * tags topics count
  * boutons:

    * **Study**
    * **Quiz**
    * **Generate QCM** (si peu de questions dispo)

## 4.4 `/learn/sub-objective/:subObjectiveCode` (Study Screen)

**Wireframe**

* Header: code + titre
* Section “Topics” (chips/list)
* Section “Notes” (optionnel v2)
* Actions (sticky bottom):

  * **Start Quiz**
  * **Generate QCM**
  * **Mark as reviewed**
* Info:

  * nombre de questions dispo
  * dernier score sur ce sous-objectif

---

# 5) Quiz (modes)

## 5.1 `/quiz` (Quiz Hub)

**Wireframe**

* Two big modes:

  * **Practice** (feedback immédiat)
  * **Exam mode** (feedback à la fin)
* Quick start:

  * “Dernier sous-objectif”
  * “Weak areas”
* Config panel:

  * Langue
  * Difficulté (1–5)
  * Nombre de questions (5/10/20)
  * Choix du scope:

    * Sous-objectif
    * Objectif complet
    * Domaine complet

## 5.2 `/quiz/setup`

(ou intégré au hub)

* Sélection scope (domain/objective/sub-objective)
* config (count/difficulty/lang)
* CTA: **Start**

## 5.3 `/quiz/session/:sessionId`

**Wireframe (1 question par écran, mobile-first)**

* Top: progress “3/10” + timer (optionnel)
* Question card:

  * question text
* Choices:

  * boutons radios grands + spacing
* CTA:

  * **Valider**
* Après validation:

  * affiche correct/incorrect (vert/rouge)
  * explication
  * bouton **Suivant**
  * bouton “Signaler question” (optionnel)

## 5.4 `/quiz/result/:sessionId`

**Wireframe**

* Score global + badge
* Stats:

  * temps moyen
  * % correct
* Breakdown:

  * par sous-objectif / topic
* Actions:

  * **Reprendre erreurs**
  * **Rejouer**
  * **Retour dashboard**

## 5.5 `/quiz/review/:sessionId`

**Wireframe**

* Liste des questions ratées
* Filtre: incorrect only / all
* “Re-try” par question

---

# 6) Dashboard (Progression)

## 6.1 `/dashboard`

**Wireframe**

* Header: progress global (%)
* Cards:

  * Streak (jours)
  * Questions answered
  * Accuracy %
* Graph (simple):

  * progression par jour (7/30 jours)
* Section “By Domain”:

  * liste domaines + progress bar
  * CTA: “details”

## 6.2 `/dashboard/domain/:domainCode`

**Wireframe**

* Graph domain performance
* Liste objectives (progress + accuracy)
* “Recommended next sub-objectives” (top 3)

## 6.3 `/dashboard/weak-areas`

**Wireframe**

* Liste triée:

  * sub-objectives les plus faibles
  * bouton “Start quiz” “Generate” “Study”

---

# 7) Profile & Settings

## 7.1 `/profile`

**Wireframe**

* User card: name/email
* Language setting (FR/EN)
* Quiz preferences (difficulty default, count default)
* Security:

  * changer mot de passe
  * sessions actives (optionnel)
* CTA:

  * **Logout**

## 7.2 `/settings` *(si tu sépares)*

* Theme (light/dark) (optionnel)
* Notifications (optionnel)

---

# 8) Admin (optionnel, si tu veux gérer le contenu)

## 8.1 `/admin`

* accès protégé role admin
* stats génération

## 8.2 `/admin/catalog-import`

* upload JSON (objectifs)
* preview + import

## 8.3 `/admin/qcm-quality`

* liste questions générées
* edit / disable / approve

---

# 9) Pages système

## 9.1 `/404`

* message + CTA Home

## 9.2 `/offline` (PWA optionnel)

---

## Wireframe de navigation (résumé)

```
Public:
  /login
  /register
  /onboarding

App:
  /app (home)
  /learn
    /learn/domain/:code
    /learn/objective/:code
    /learn/sub-objective/:code
  /quiz
    /quiz/setup
    /quiz/session/:id
    /quiz/result/:id
    /quiz/review/:id
  /dashboard
    /dashboard/domain/:code
    /dashboard/weak-areas
  /profile
```

---

