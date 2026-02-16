# 🌐 SIMULATION_NEXUS

![Project Banner]()
> **Exploration Algorithmique & Systèmes Complexes**

**Simulation_Nexus** est un portfolio interactif regroupant trois expériences visuelles basées sur les mathématiques, la biologie et la théorie des jeux. Ce projet démontre comment des règles locales simples peuvent engendrer des comportements globaux complexes (émergence).

🔗 **[Mon profil](https://github.com/cnuddeMatteo)**

---

## 🧪 Les Modules

Ce Nexus connecte trois simulations distinctes, entièrement codées en **Vanilla JS** et rendues via l'API **Canvas HTML5** pour une performance optimale (60 FPS).

### 1. 🧬 Bio-Digital Life (Jeu de la Vie de Conway)
Une réinterprétation esthétique de l'automate cellulaire le plus célèbre.
* **Concept :** Évolution de populations cellulaires selon des règles de survie/mort.
* **Features :** Effet de rémanence (Ghost trails), couleurs dynamiques, dessin à la souris, et presets (Planeurs, Canons de Gosper).
* **Style :** Vert Cyber / Matrix.

### 2. 🚗 Braess Paradox (Théorie des Jeux)
Une démonstration contre-intuitive de l'optimisation des réseaux routiers.
* **Concept :** *Pourquoi ajouter une route peut ralentir le trafic global ?* (Équilibre de Nash).
* **Features :** Simulation d'agents (voitures) avec pathfinding en temps réel, visualisation des congestions par code couleur thermique.
* **Style :** Orange Industriel / Traffic.

### 3. 🦠 Turing Fluid (Réaction-Diffusion)
Une simulation organique basée sur le modèle de Gray-Scott.
* **Concept :** Comment la nature crée des motifs (rayures de zèbre, taches de léopard, coraux) via la chimie.
* **Features :** Paramètres *Feed* et *Kill* ajustables en temps réel, presets (Mitose, Corail, Chaos).
* **Style :** Cyan Néon / Bioluminescence.

---

## 🛠️ Stack Technique

* **Core :** HTML5, CSS3, JavaScript (ES6+).
* **Rendu :** HTML5 `<canvas>` (2D Context).
* **Design :** CSS Variables, Flexbox/Grid, Animations CSS, Glassmorphism.
* **Aucune librairie externe :** Tout est codé à la main pour maîtriser la performance et la logique.

---

## 🚀 Installation & Utilisation

Ce projet est statique, il ne nécessite aucun backend ni compilation.

1.  **Cloner le dépôt :**
    ```bash
    git clone [https://github.com/ton-pseudo/simulation_nexus.git](https://github.com/ton-pseudo/simulation_nexus.git)
    ```
2.  **Lancer :**
    Ouvrez simplement le fichier `index.html` dans votre navigateur web préféré.

---

## 📂 Structure du Projet

```text
simulation_nexus/
├── index.html           # Le Hub Central (Portail)
├── creator.html         # Page Créateur Globale
├── style_hub.css        # Styles du Hub
├── lifeGame/            # Module Jeu de la Vie
│   ├── life.html
│   ├── script_life.js
│   └── style_life.css
├── paradoxBraess/       # Module Trafic (Braess)
│   ├── braess.html
│   ├── braess_info.html
│   ├── script_braess.js
│   └── style_braess.css
└── turing/              # Module Chimie (Réaction-Diffusion)
    ├── reaction.html
    ├── rd_info.html
    ├── script_rd.js
    └── style_rd.css
```
---

## 👤 Auteur

**Mattéo Cnudde** - *Architecte Numérique & Explorateur de Systèmes*

Passionné par l'intersection entre le code, les mathématiques et la nature.

* [GitHub](https://github.com/cnuddeMatteo)
* [Buy Me A Coffee](https://buymeacoffee.com/spunnn)

---

> *"L'ordre naît du chaos."*
