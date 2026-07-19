# API Port Russel - Documentation de livraison

## 1) Presentation

Cette API Node.js/Express gere:
- authentification JWT
- gestion des utilisateurs
- gestion des catways
- gestion des reservations

La base MongoDB est utilisee via Mongoose.

## 2) Prerequis

- Node.js 18+
- npm 9+
- Un cluster MongoDB Atlas accessible depuis votre IP

## 3) Installation

Depuis le dossier `mon_application`:

```bash
npm install
```

## 4) Configuration environnement

Un template est fourni: `env/.env.example`.

Creer vos fichiers de travail dans `env/`:
- `.env.dev`
- `.env`
- `.env.prod`

Variables importantes:
- `URL_MONGO`
- `PORT`
- `API_URL`
- `JWT_SECRET` (secret fort, 24+ caracteres)
- `JWT_EXPIRES_IN` (ex: `2h`)
- `JWT_AUDIENCE` (ex: `api-port-russel-client`)
- `CORS_ALLOWED_ORIGINS` (liste separee par virgules)
- `LOGIN_RATE_LIMIT_MAX_ATTEMPTS`
- `LOGIN_RATE_LIMIT_WINDOW_MS`

## 5) Lancement

```bash
npm run dev
```

Autres modes:

```bash
npm run start
npm run prod
```

## 6) Seed des donnees

Le seed lit les fichiers JSON racine sans les modifier:
- `../catways.json`
- `../reservations.json`

Commandes:

```bash
npm run seed:catways
npm run seed:reservations
npm run seed:all
```

Le seed est idempotent (relance sans duplication).

## 7) Authentification

### Login

`POST /auth/login`

Exemple body:

```json
{
  "email": "user@mail.com",
  "password": "motdepasse"
}
```

Reponse OK: token JWT + utilisateur (sans password).

### Header requis sur routes protegees

```http
Authorization: Bearer <token>
```

## 8) Endpoints principaux

### Public
- `GET /`
- `POST /users` (creation user)
- `POST /auth/login`

### Proteges JWT
- `GET /users`
- `GET /users/:id`
- `PUT /users/:id`
- `DELETE /users/:id`
- `GET /catways`
- `GET /catways/:catwayNumber`
- `POST /catways`
- `PUT /catways/:catwayNumber`
- `DELETE /catways/:catwayNumber`
- `GET /reservations`
- `GET /reservations/:id`
- `GET /reservations/catway/:catwayNumber`
- `POST /reservations`
- `PUT /reservations/:id`
- `DELETE /reservations/:id`

## 9) Tests API Postman/Newman

Fichiers Postman:
- `postman/Api-Port-Russel-Phase7.postman_collection.json`
- `postman/Api-Port-Russel-Phase7.postman_environment.json`

Execution auto via Newman:

```bash
npm run test:api:phase7
npm run test:api:phase7:with-seed
```

## 10) Securite appliquee

- JWT avec verification `issuer` (et `audience` si configuree)
- Rate limit sur `/auth/login`
- Headers HTTP de securite
- CORS via allowlist
- Limitation de taille des payloads
- Messages d'erreur API minimalistes

## 11) Probleme connu

Si la connexion MongoDB echoue avec Atlas:
- verifier que votre IP est autorisee dans Network Access
- verifier les identifiants MongoDB dans `URL_MONGO`

## 12) Workflow Git conseille

- 1 branche par phase
- 1 commit clair par phase
- 1 PR par phase

Branches deja utilisees:
- `feature/1erBranch`
- `feature/2emeBranch`
- `feature/3emeBranch`
- `feature/4emeBranch`
- `feature/5emeBranch`
