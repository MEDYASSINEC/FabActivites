# Guide d'Utilisation - FabActivités (CMC Tanger)

Ce guide présente l'utilisation globale de **FabActivités**, la plateforme de suivi des projets, présences et occupations du **FABLAB CMC Tanger**, à destination des utilisateurs finaux et des administrateurs.

---

## 🚀 Démarrage Rapide (Installation en un clic)

Si vous installez l'application sur un nouvel ordinateur d'utilisateur (sans installer de logiciels techniques au préalable sur l'ordinateur) :

1. **Première installation :**
   - Ouvrez le dossier du projet.
   - Double-cliquez sur le fichier **`installer.bat`**.
   - Une fenêtre noire (terminal) s'ouvre et télécharge automatiquement toutes les technologies nécessaires (PHP portable, Node.js portable, base de données SQLite locale, dépendances applicatives). Cela peut prendre 2 à 5 minutes selon votre connexion internet.
   - Une fois l'installation terminée, la fenêtre vous indiquera d'appuyer sur une touche pour fermer.

2. **Démarrer l'application :**
   - Double-cliquez sur le fichier **`demarrer.bat`**.
   - Vos serveurs locaux se lancent automatiquement en arrière-plan et votre navigateur internet par défaut s'ouvre directement sur l'application (`http://localhost:5173`).
   - Laissez la fenêtre du terminal ouverte pendant que vous utilisez l'application.

3. **Arrêter l'application :**
   - Quand vous avez fini, revenez sur la fenêtre noire du terminal et appuyez sur n'importe quelle touche pour couper proprement tous les serveurs.

---

## 🧭 Navigation Générale

L'application comporte un menu latéral de navigation permettant d'accéder aux différentes pages :
1. **Tableau de bord (Dashboard)** : Visualisation graphique des indicateurs clés (KPIs).
2. **Projets** : Liste des projets actifs au sein du Fablab.
3. **Fréquentations** : Journal de présence pour les formations, ateliers et visites.
4. **Occupations** : Suivi détaillé de l'occupation des zones et de l'outillage machine.
5. **Paramètres** : Configuration générale de l'application.

---

## 📊 1. Tableau de bord (Dashboard)

Le tableau de bord permet de piloter l'activité du FABLAB grâce à des graphiques dynamiques :
- **Analyse des Formations/Séances** : Affiche le nombre de séances, de participants uniques, de formations et les durées globales par mois.
- **Analyse de l'Outillage** : Liste des machines les plus sollicitées et de leur durée totale d'utilisation.
- **Taux d'Occupation des Zones** : Permet de voir quelles sont les zones les plus occupées du Fablab.
- **Statut des Projets** : Répartition des projets par statut (Prévu, En Cours, Réalisé, Suspendu, Abandonné).

### 💡 Fonctionnalités pratiques :
- **Exporter en PNG** : Chaque graphique dispose d'un bouton `PNG` permettant de télécharger une capture image haute définition du graphique pour vos rapports de présentation.
- **Filtres de dates** : Vous pouvez filtrer les indicateurs par plage temporelle pour affiner vos analyses mensuelles ou annuelles.

---

## 📝 2. Gestion des Données via la Table Interactive (Grille Excel)

Les pages **Projets**, **Fréquentations** et **Occupations** utilisent un tableau interactif très puissant similaire à Microsoft Excel.

### ⌨️ Raccourcis et édition en ligne :
- **Édition d'une cellule** : Double-cliquez sur une cellule ou sélectionnez-la et appuyez sur **`F2`** pour entrer en mode édition.
- **Navigation au clavier** : Utilisez les flèches directionnelles (`▲`, `▼`, `◀`, `▶`) pour naviguer de cellule en cellule.
- **Valider l'édition** : Appuyez sur **`Entrée`** ou cliquez en dehors de la cellule pour enregistrer temporairement la modification.
- **Passer à la cellule suivante** : Appuyez sur **`Tab`** pour valider et éditer automatiquement la cellule à droite.
- **Annuler la modification en cours** : Appuyez sur **`Échap`** (Escape) pour quitter le mode édition sans enregistrer.
- **Tri et Filtrage** : Cliquez sur l'en-tête de n'importe quelle colonne pour trier les données ou ouvrir les filtres de sélection de valeurs.

### 🛠️ Barre d'actions rapides (Ruban) :
- **`+ Ajouter`** : Ouvre un formulaire guidé pour créer une nouvelle ligne.
- **`📋 Dupliquer`** : Duplique instantanément les lignes sélectionnées en y adaptant automatiquement la date et l'heure actuelle.
- **`🗑 Supprimer`** : Supprime les lignes sélectionnées.
- **`⧉ Copier`** : Copie la sélection ou l'intégralité du tableau dans votre presse-papiers sous forme tabulée (prêt à être collé dans Microsoft Excel ou Google Sheets).
- **`↓ Exporter .xlsx`** : Télécharge directement le tableau sous forme de fichier Excel standard.
- **`💾 Sauvegarder`** : Les modifications faites dans le tableau sont d'abord marquées en mémoire. Un badge rouge affiche le nombre de changements en attente. Cliquez sur **`💾 Sauvegarder`** pour enregistrer définitivement toutes vos modifications sur le serveur.

> [!WARNING]
> Si vous tentez de quitter la page ou de fermer le navigateur alors que vous avez des modifications non sauvegardées (badge rouge actif), une alerte s'affichera pour vous demander de confirmer votre départ afin d'éviter toute perte accidentelle de données.

---

## 🕒 3. Page Fréquentation & Sessions Actives

La page Fréquentation sert à enregistrer le passage des utilisateurs dans le Fablab.
- **Participants** : Lors de l'ajout d'une fréquentation, vous pouvez spécifier la liste des participants (stagiaires, formateurs, visiteurs).
- **Sessions Actives (Popup Flottante)** : Si une session d'activité est en cours (sans heure de fin renseignée), un encart orange s'affiche en bas à droite de l'écran. Vous pouvez mettre fin à cette session en un seul clic sur le bouton **`Finir`**, ce qui enregistrera l'heure de fin actuelle.

---

## ⚙️ 4. Page Occupation & Calcul de la Durée

La page Occupation suit l'usage des équipements et des zones.
- **Zone & Outillage** : Vous pouvez choisir parmi une liste prédéfinie (ex: Zone Imprimante 3D, Fraiseuse CNC) ou sélectionner "--- Autre ---" pour saisir manuellement une nouvelle zone ou machine.
- **Nouvelle colonne Durée** : Une colonne "Durée" calculée automatiquement a été ajoutée. Elle calcule en temps réel la différence entre l'**Heure de début** et l'**Heure de fin** saisies :
  - La valeur s'affiche au format lisible, par exemple : `1 h 45 min`, `45 min`, ou `2 h`.
  - La cellule est en **lecture seule** (curseur standard, double-clic désactivé) pour empêcher toute saisie manuelle erronée.
  - La durée se recalcule instantanément dès que vous modifiez l'heure de début ou de fin sur la ligne.
  - La durée est également générée dynamiquement à la création d'une ligne ou lors de la duplication.

---

## 📥 5. Importation de données (Excel)

L'importation de données en masse s'effectue depuis la page **Paramètres** dans la section **Import de données (Excel)**. Les formats de fichiers supportés sont `.xlsx`, `.xls` et `.csv`. 

Pour que l'importation fonctionne correctement, les fichiers Excel doivent comporter des en-têtes spécifiques (sur la première ligne) correspondant aux champs ci-dessous.

### 📋 Importation des Projets (Feuille "Liste de projets")

Le système recherche spécifiquement la feuille nommée **`Liste de projets`** (les noms alternatifs comme `projets` ou `Projets` sont également acceptés). Le système lit les colonnes suivantes :

| En-têtes Excel reconnus (Insensible à la casse) | Description / Type de donnée | Obligatoire / Optionnel |
| :--- | :--- | :--- |
| `intitule_projet` ou `nom_du_projet` | Nom du projet | **Obligatoire** |
| `responsable_de_projet` ou `responsable_projet` ou `responsable` | Nom du responsable du projet (ne doit pas être vide) | **Obligatoire** (Requis par la base de données) |
| `source_du_projet` ou `source` | Source / Partenaire du projet | Optionnel |
| `statut` | Statut (`Prévu`, `En cours`, `Réalisé`, `Suspendu`, `Abandonné`) | Optionnel (Défaut: `En cours`) |
| `etape` | Étape du projet | Optionnel |
| `pole` | Pôle associé au projet | Optionnel |
| `filiere` | Filière de formation associée | Optionnel |
| `groupe` | Groupe associé | Optionnel |
| `date_debut` ou `dt_debut` | Date de début du projet | Optionnel |
| `date_fin_prevue` ou `dt_fn_prevu` | Date de fin prévisionnelle | Optionnel |
| `date_fin_reelle` ou `dt_fn_reel` | Date de fin réelle | Optionnel |
| `date_suspension` ou `dt_suspension` | Date de suspension du projet | Optionnel |
| `date_abandon` ou `dt_abandon` | Date d'abandon du projet | Optionnel |
| `remarques` | Remarques / Observations | Optionnel |

---

### 🕒 Importation des Fréquentations & Occupations (Feuilles "Fréquentation" et "Occupation")

Le système lit automatiquement les deux feuilles présentes dans le fichier Excel :
1. La feuille **`Fréquentation`** (noms alternatifs : `frequentations`, `Frequentations`) : contient les passages et participants.
2. La feuille **`Occupation`** (noms alternatifs : `occupations`, `Occupations`) : contient les détails d'utilisation des machines et des zones du Fablab, qui sont automatiquement rattachés à la fréquentation correspondante par date et nom d'activité.

#### En-têtes lus dans la feuille "Fréquentation" :

| En-têtes Excel reconnus (Insensible à la casse) | Description / Type de donnée | Obligatoire / Optionnel |
| :--- | :--- | :--- |
| `date` | Date du jour de présence (ex: `2026-06-16`) | **Obligatoire** |
| `heure_debut` ou `heur_debut` | Heure d'arrivée au format `HH:MM` (ex: `09:00`) | **Obligatoire** |
| `nom_de_lactiviteprojet` ou `nom_activite` ou `projet` | Nom de l'activité ou du projet lié | **Obligatoire** |
| `heure_fin` ou `heur_fin` | Heure de départ au format `HH:MM` (ex: `12:30`) | Optionnel |
| `type_activite` | Type d'activité (ex: `Formation`, `Atelier`, `Visite`) | Optionnel (Défaut: `Autre`) |
| `etapeseance` ou `etape_seance` ou `etape` | Étape ou séance (lit la colonne `Etape/Séance` de l'Excel) | Optionnel |
| `intervenantresponsable` ou `intervenant_responsable` ou `intervenant` ou `responsable` | Responsable de la séance (lit la colonne `Intervenant/Responsable`) | Optionnel |
| `role` | Rôle de l'intervenant | Optionnel |
| `nom_participants` ou `participants` | Liste de participants séparés par des virgules (enregistre et lie les élèves en base) | Optionnel |
| `pole` | Pôle associé (utilisé pour créer l'activité si elle n'existe pas) | Optionnel |
| `filiere` | Filière associée (utilisé pour créer l'activité si elle n'existe pas) | Optionnel |
| `groupe` | Groupe associé (utilisé pour créer l'activité si elle n'existe pas) | Optionnel |

#### En-têtes lus dans la feuille "Occupation" :

| En-têtes Excel reconnus (Insensible à la casse) | Description / Type de donnée | Obligatoire / Optionnel |
| :--- | :--- | :--- |
| `date` | Date de l'occupation | **Obligatoire** |
| `nom_de_lactiviteprojet` ou `nom_activite` ou `projet` | Nom de l'activité ou projet lié | **Obligatoire** |
| `zone_occupee` | Nom de la zone occupée (ex: `Zone impression 3D`) | Optionnel |
| `outillage_machine_utilisee` ou `outillage_machine` | Machine ou outil utilisé (lit la colonne `Outillage / Machine utilisée`) | Optionnel |
| `heure_debut` ou `heur_debut` | Heure de début d'utilisation | Optionnel |
| `heure_fin` ou `heur_fin` | Heure de fin d'utilisation | Optionnel |

> [!TIP]
> **Liaison Intelligente des Projets :** Lors de l'import, le système effectue une recherche intelligente (insensible à la casse) sur le nom de l'activité/projet. S'il correspond à un projet existant dans la base de données, la fréquentation y sera liée. S'il n'y a pas de correspondance, une nouvelle activité autonome est créée automatiquement.
> Les occupations sont également associées en temps réel à la bonne fiche de fréquentation de la même journée.

---

## 💾 6. Sauvegarde (Backup) des données

Pour éviter toute perte accidentelle de données, vous pouvez créer et télécharger un fichier de sauvegarde directement sur votre ordinateur.

### 📥 Télécharger une sauvegarde :
1. Accédez à la page **Paramètres** dans le menu latéral.
2. Cliquez sur l'onglet **Sauvegarde de la base de données**.
3. Cliquez sur le bouton vert **`💾 Télécharger la sauvegarde`**.
4. L'application génère automatiquement le fichier et lance le téléchargement :
   * Si l'application tourne en mode portable (SQLite) : vous obtiendrez un fichier de base de données direct au format `.sqlite` (ex: `backup_database_2026-06-16_18-20-00.sqlite`).
   * Si l'application tourne sur un serveur MySQL : vous obtiendrez un script de restauration au format `.sql` contenant l'ensemble des structures de tables et les données associées.
5. Le fichier de sauvegarde est automatiquement placé par votre navigateur dans votre dossier **Téléchargements** (Downloads) local.

### 🔄 Restaurer une sauvegarde (Remise en place des données) :

Selon le mode de fonctionnement de votre base de données :

#### A. Si l'application tourne en mode portable (SQLite - Recommandé pour les utilisateurs) :
1. **Arrêtez l'application** en fermant la fenêtre du terminal `demarrer.bat`.
2. Accédez au dossier du projet, puis au sous-dossier : `backend/database/`.
3. Renommez le fichier de base de données actuel `database.sqlite` (par exemple en `database_ancien.sqlite`) pour en garder une copie de sécurité.
4. Prenez votre fichier de sauvegarde (ex: `backup_database_2026-06-16_18-20-00.sqlite`) et **renommez-le exactement** en `database.sqlite`.
5. **Copiez/Collez** ce fichier renommé dans le dossier `backend/database/`.
6. Relancez l'application via **`demarrer.bat`**. Toutes vos données sauvegardées sont maintenant restaurées.

#### B. Si l'application tourne sur un serveur MySQL (Développeurs / Production) :
1. Ouvrez votre gestionnaire de base de données (ex: **phpMyAdmin** via `http://localhost/phpmyadmin`).
2. Sélectionnez la base de données de l'application (ex: `gestionPrjtFBLB`).
3. Cliquez sur l'onglet **Importer** (Import) en haut.
4. Sélectionnez le fichier de sauvegarde `.sql` téléchargé.
5. Cliquez sur le bouton **Importer** ou **Exécuter** en bas pour recharger toutes les tables et les données.
