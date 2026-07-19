# Livrable attendu - API Port Russel

## 1. Objectif du livrable

Fournir une API REST fonctionnelle, securisee et testable, avec une procedure claire de reproduction.

## 2. Contenu a remettre

- Code source du dossier mon_application.
- Documentation de lancement et d'utilisation.
- Fichiers de tests Postman.
- Scripts de seed et de tests automatiques.
- Historique Git par phases (branches et commits).

## 3. Fichiers principaux a verifier

- README.md
- env/.env.example
- postman/Api-Port-Russel-Phase7.postman_collection.json
- postman/Api-Port-Russel-Phase7.postman_environment.json
- scripts/seed.js
- package.json

## 4. Checklist de validation avant rendu

### 4.1 Installation

- npm install execute sans erreur.
- Les dependances sont presentes.

### 4.2 Configuration

- URL_MONGO est correcte.
- JWT_SECRET n'est pas une valeur de test.
- CORS_ALLOWED_ORIGINS est coherent avec le client.

### 4.3 Demarrage

- npm run dev demarre l'API.
- Le endpoint GET / repond correctement.

### 4.4 Donnees

- npm run seed:all charge catways et reservations.
- Relancer seed:all ne cree pas de doublons.

### 4.5 Tests API

- npm run test:api:phase7 passe sans echec.
- Les routes protegees refusent les appels sans token.
- Le login retourne un token valide.

### 4.6 Securite

- Rate limit actif sur /auth/login.
- Headers de securite presents.
- Tokens verifies avec issuer (et audience si configuree).

## 5. Procedure de recette recommandee

1. npm install
2. npm run seed:all
3. npm run dev
4. Dans un autre terminal: npm run test:api:phase7

## 6. Ce que doit pouvoir faire un correcteur

- Cloner le depot.
- Configurer ses variables env a partir de env/.env.example.
- Demarrer l'API localement.
- Lancer les tests Postman/Newman.
- Verifier les fonctionnalites users, auth, catways et reservations.

## 7. Notes de livraison

- Ne pas livrer de secrets reels dans le depot.
- Si Atlas bloque l'acces, verifier la whitelist IP.
- Garder un commit propre par phase pour la lecture du projet.
