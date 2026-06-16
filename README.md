# FabActivités (CMC Tanger) - Guide Développeur

Bienvenue dans le dépôt de **FabActivités**, le système de suivi des projets, présences et occupations du **FABLAB CMC Tanger**. Ce projet est composé d'une API backend développée en PHP (Laravel) et d'un frontend en JavaScript (React + Vite).

---

## 🛠️ Architecture du Projet

Le projet est divisé en deux parties indépendantes mais interconnectées :

1. **Backend (`/backend`)** :
   - Framework: **Laravel 12.x** (PHP ^8.2).
   - Base de données: MySQL / MariaDB (configurée via `.env`).
   - Gère l'API REST, les modèles relationnels (Projets, Fréquentations, Occupations, Participants, etc.) et l'analyse de données pour les graphiques.

2. **Frontend (`/frontend`)** :
   - Framework: **React + Vite** (Single Page Application).
   - Bibliothèque de graphes: **Recharts** pour les analyses visuelles.
   - Système de grille: **ExcelTable** (composant personnalisé de grille type tableur avec édition en ligne, filtres et tris interactifs).

---

## ⚙️ Prérequis

Assurez-vous d'avoir les outils suivants installés sur votre machine :
- **PHP >= 8.2** avec les extensions requises pour Laravel.
- **Composer** (gestionnaire de dépendances PHP).
- **Node.js (LTS)** & **npm** (gestionnaire de paquets JavaScript).
- Un serveur de base de données **MySQL** ou **MariaDB** (comme XAMPP, Laragon ou Docker).

---

## 🚀 Installation & Configuration

### 1. Cloner le dépôt et accéder au dossier
```bash
cd "gestion fablab"
```

### 2. Configurer le Backend
Allez dans le dossier `backend` :
```bash
cd backend
```

1. **Installer les dépendances PHP :**
   ```bash
   composer install
   ```

2. **Créer le fichier de configuration `.env` :**
   Copiez le fichier d'exemple et générez la clé de chiffrement de l'application :
   ```bash
   copy .env.example .env
   php artisan key:generate
   ```

3. **Configurer la base de données dans le fichier `.env` :**
   Ouvrez le fichier `.env` nouvellement créé et modifiez les variables suivantes avec vos accès locaux :
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=gestion_fablab
   DB_USERNAME=votre_utilisateur
   DB_PASSWORD=votre_mot_de_passe
   ```
   *(Créez d'abord la base de données vide `gestion_fablab` via phpMyAdmin ou votre client SQL).*

4. **Lancer les migrations et remplir les données d'exemples (seeders) :**
   ```bash
   php artisan migrate --seed
   ```

5. **Démarrer le serveur de développement backend :**
   ```bash
   php artisan serve
   ```
   Le serveur backend démarrera sur `http://127.0.0.1:8000`.

---

### 3. Configurer le Frontend
Dans un autre terminal, accédez au dossier `frontend` :
```bash
cd ../frontend
```

1. **Installer les paquets npm :**
   ```bash
   npm install
   ```

2. **Vérifier le fichier `.env` :**
   Assurez-vous d'avoir un fichier `.env` pointant sur l'URL de l'API backend :
   ```env
   VITE_API_URL=http://127.0.0.1:8000/api
   ```

3. **Démarrer le serveur de développement frontend :**
   ```bash
   npm run dev
   ```
   Le serveur démarrera sur `http://localhost:5173`. Ouvrez ce lien dans votre navigateur.

---

## 📋 Principales commandes de développement

### Backend
- **Migrer la base de données :** `php artisan migrate`
- **Rafraîchir la base avec les données de test :** `php artisan migrate:fresh --seed`
- **Lancer les tests unitaires :** `php artisan test`
- **Créer un nouveau contrôleur API :** `php artisan make:controller API/MonController --api`

### Frontend
- **Lancer le serveur en mode dev :** `npm run dev`
- **Créer le build de production :** `npm run build`
- **Lancer l'analyseur de code (Linter) :** `npm run lint`

---

## 🏗️ Structure des fichiers clés

### Frontend
- [App.jsx](file:///c:/Users/HP/Desktop/gestion%20fablab/frontend/src/App.jsx) : Définition des routes principales de l'application.
- [ExcelTable.jsx](file:///c:/Users/HP/Desktop/gestion%20fablab/frontend/src/components/ExcelTable.jsx) : Grille réutilisable interactive inspirée de Microsoft Excel.
- [pages/Occupation.jsx](file:///c:/Users/HP/Desktop/gestion%20fablab/frontend/src/pages/Occupation.jsx) : Page de gestion des occupations avec la durée calculée à la volée.

### Backend
- [api.php](file:///c:/Users/HP/Desktop/gestion%20fablab/backend/routes/api.php) : Fichier de définition des routes de l'API REST.
- [OccupationController.php](file:///c:/Users/HP/Desktop/gestion%20fablab/backend/app/Http/Controllers/OccupationController.php) : Gère le CRUD des occupations.
- [DashboardController.php](file:///c:/Users/HP/Desktop/gestion%20fablab/backend/app/Http/Controllers/DashboardController.php) : Fournit les données agrégées et optimisées pour les graphiques du Dashboard.
