Voici une version mise à jour et enrichie de ton **README.md**. J'ai ajouté les trois nouveaux projets (**Fermi, Maxwell, Hilbert**), mentionné les nouvelles fonctionnalités (Audio procédural, Menus immersifs) et mis à jour l'arborescence des fichiers.

Tu peux copier-coller ce bloc directement dans ton fichier `README.md`.

---

# 🌐 SIMULATION_NEXUS

> **Exploration Algorithmique & Systèmes Complexes**

**Simulation_Nexus** est un portfolio interactif regroupant **six expériences visuelles** basées sur les mathématiques, la physique, la biologie et la philosophie. Ce projet démontre comment des règles locales simples peuvent engendrer des comportements globaux complexes, le tout via une interface immersive style Sci-Fi / Cyberpunk.

🔗 **[Voir le projet en ligne](https://cnuddematteo.github.io/simulation_nexus/)** 

---

## 🧪 Les Modules

Ce Nexus connecte six simulations distinctes, entièrement codées en **Vanilla JS**, rendues via l'API **Canvas HTML5** et sonorisées via **Web Audio API**.

### 1. 🧬 Bio-Digital Life (Jeu de la Vie)

*Une réinterprétation esthétique de l'automate cellulaire de Conway.*

* **Concept :** Évolution de populations cellulaires selon des règles de survie/mort.
* **Features :** Mode "Peinture" à la souris, Audio procédural (Bips organiques), Presets (Canons, Vaisseaux).
* **Thème :** 🟢 **Vert Matrix**

### 2. 🚗 Braess Paradox (Trafic & Théorie des Jeux)

*Une démonstration contre-intuitive de l'optimisation des réseaux.*

* **Concept :** *Pourquoi ajouter une route peut ralentir le trafic global ?* (Équilibre de Nash).
* **Features :** IA de conduite avec pathfinding dynamique, Sliders de densité, Audio ASMR Trafic, Visualisation thermique des bouchons.
* **Thème :** 🟠 **Orange Industriel**

### 3. 🦠 Turing Patterns (Réaction-Diffusion)

*La chimie de la nature.*

* **Concept :** Comment la nature crée des motifs (rayures, taches) via la compétition chimique (Gray-Scott).
* **Features :** Paramètres *Feed/Kill* en temps réel, Pinceau chimique, Presets (Mitose, Corail).
* **Thème :** 🔵 **Cyan Bioluminescent**

### 4. 🌌 Fermi Paradox (Le Grand Filtre)

*Sommes-nous seuls dans l'univers ?*

* **Concept :** Simulation de la colonisation galactique et du "Grand Filtre" qui éteint les civilisations.
* **Features :** Zoom/Pan infini, Génération procédurale de galaxies, Sliders d'expansion et d'extinction.
* **Thème :** 💠 **Cyan Espace**

### 5. 🌡️ Maxwell's Demon (Entropie)

*Le démon qui défie la thermodynamique.*

* **Concept :** Trier des particules chaudes et froides pour inverser l'entropie.
* **Features :** Moteur physique de collision, Contrôle de la porte au clic/clavier, Graphiques d'entropie en temps réel.
* **Thème :** 🟣 **Rose Néon**

### 6. 🏨 Hilbert's Hotel (L'Infini)

*Le vertige des mathématiques.*

* **Concept :** Gérer un hôtel complet avec une infinité de chambres pour accueillir une infinité de nouveaux clients.
* **Features :** Visualisation de décalages de tableaux infinis, Paradoxe du Bus ().
* **Thème :** 🟡 **Jaune Cyberpunk**

---

## ✨ Fonctionnalités Globales

* **Audio Procédural :** Aucun fichier MP3. Tous les sons (bips, drones, moteurs) sont synthétisés en temps réel par le navigateur pour une expérience légère et organique.
* **Immersion :** Chaque projet dispose d'un *Start Screen* contextuel et de pages d'informations pédagogiques ("Archives").
* **Performance :** Optimisé pour 60 FPS constants.

---

## 🛠️ Stack Technique

* **Core :** HTML5, CSS3, JavaScript (ES6+).
* **Rendu :** HTML5 `<canvas>` (2D Context).
* **Audio :** Web Audio API (Oscillators, GainNodes).
* **Design :** CSS Variables, Flexbox/Grid, Glassmorphism, Animations CSS.
* **Zéro Dépendance :** Aucun framework, aucune librairie externe.

---

## 📂 Structure du Projet

```text
simulation_nexus/
├── index.html          # LE HUB (Portail d'accès)
├── style_hub.css       # Styles globaux du Hub
├── life/               # [Jeu de la Vie]
│   ├── life.html
│   ├── script_life.js
│   └── style_life.css
├── braess/             # [Paradoxe de Braess]
│   ├── braess.html
│   ├── script_braess.js
│   └── style_braess.css
├── turing/             # [Réaction-Diffusion]
│   ├── reaction.html
│   ├── script_rd.js
│   └── style_rd.css
├── fermi/              # [Paradoxe de Fermi]
│   ├── fermi.html
│   ├── script_fermi.js
│   └── style_fermi.css
├── maxwell/            # [Démon de Maxwell]
│   ├── maxwell.html
│   ├── script_maxwell.js
│   └── style_maxwell.css
└── hotel/              # [Hôtel de Hilbert]
    ├── hotel.html
    ├── script_hotel.js
    └── style_hotel.css

```

---

## 🚀 Installation

Ce projet est statique (Client-side only).

1. **Cloner le dépôt :**
```bash
git clone https://github.com/cnuddeMatteo/simulation_nexus.git

```


2. **Lancer :**
Ouvrez simplement le fichier `index.html` dans votre navigateur ou utilisez une extension comme *Live Server* pour éviter les problèmes de CORS (notamment pour les modules audio sur certains navigateurs).

---

## 👤 Auteur

**Mattéo Cnudde** - *Etudiant en Informatique*

* [GitHub](https://github.com/cnuddeMatteo)
* [Buy Me A Coffee](https://buymeacoffee.com/spunnn)

---

> *"L'ordre naît du chaos."*
