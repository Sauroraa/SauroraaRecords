# SauroraaMusic Mobile - Analyse technique

## Objectif

Construire une application mobile `SauroraaMusic` fonctionnelle avec l'ecosysteme actuel de `sauroraarecords.be`, sans dupliquer inutilement la logique deja presente dans le backend et le site web.

## Constats sur l'existant

### 1. Le backend actuel est deja exploitable pour un MVP mobile

Le projet expose deja une API NestJS avec des modules directement utiles pour une application mobile:

- `auth`: connexion, refresh, profil courant
- `artists`: liste, detail, stats publiques, inbox artiste
- `releases`: listing, detail, trending, stats overview
- `stream`: token de lecture securise et verification HLS
- `comments`: lecture et creation de commentaires
- `follows`: abonnement aux artistes
- `notifications`: liste et marquage lu
- `search`: recherche artistes/releases

En pratique, cela suffit deja pour un MVP mobile centré sur:

- decouverte
- lecture audio
- profils artistes
- commentaires
- follows
- notifications in-app

### 2. Le site actuel se compose de trois briques distinctes

- `frontend/`: site principal Next.js pour `sauroraarecords.be`
- `backend/`: API NestJS + Prisma
- `music-web/`: client web musique separe, en Express + HTML/JS integre dans `server.js`

Le backend est la bonne base de mutualisation pour le mobile.
Le `music-web` ne doit pas etre porte tel quel en mobile: il sert surtout de reference produit et de logique d'UX streaming.

### 3. L'authentification est presque mobile-ready, mais pas totalement formalisee

Le backend accepte:

- le cookie `access_token`
- le header `Authorization: Bearer ...`

Donc un client mobile natif peut deja s'authentifier via bearer token.
En revanche, les endpoints d'auth actuels sont penses d'abord pour le web, car `login` et `refresh` positionnent surtout des cookies HTTP-only.

### 4. Le streaming securise est deja une vraie base differentiatrice

Le flux actuel n'expose pas directement les fichiers HLS.
Le client demande un token de lecture via `/api/stream/token/:releaseId`, puis Nginx valide ce token via `/api/stream/verify`.

Pour mobile, c'est exploitable et c'est preferable a une exposition directe des assets audio.

### 5. Les notifications push ne sont pas terminees

Le schema Prisma contient bien un modele `PushDevice`, mais aucun controller mobile-dedie visible ne permet:

- d'enregistrer un device token
- de supprimer un device token
- d'envoyer des pushes ciblees iOS/Android

Les notifications existent donc en base et dans l'app web, mais la chaine mobile push n'est pas finie.

## Conclusion produit

Oui, il est pertinent de creer `SauroraaMusic` maintenant.

Le projet dispose deja de suffisamment d'API pour sortir une premiere application mobile fonctionnelle, a condition de:

1. ne pas essayer de porter tout `sauroraarecords.be`
2. cibler un MVP streaming/decouverte/compte utilisateur
3. ajouter une petite couche backend mobile-specifique la ou il manque encore des contrats

## Proposition d'architecture mobile

### Choix recommande

Utiliser `React Native` avec `Expo`.

Raisons:

- base TypeScript coherente avec le frontend actuel
- vitesse de mise en oeuvre elevee
- bon support audio, secure storage et notifications
- plus simple pour iOS + Android qu'un demarrage natif complet
- possibilite de partager une partie des types et contrats API

### Structure recommandee

Ajouter un nouveau projet:

- `mobile/`

Stack recommandee:

- Expo Router
- React Query
- Zustand ou state local cible
- `expo-secure-store` pour les tokens
- `expo-av` ou lecteur plus adapte au HLS selon contraintes finales
- `expo-notifications` pour le push

## MVP recommande

### Ecrans a livrer en premier

- splash / bootstrap session
- login
- home
- recherche
- release detail
- artist detail
- player plein ecran
- notifications
- bibliotheque simple
- profil / logout

### Fonctionnalites MVP

- connexion utilisateur
- persistance de session
- liste des releases
- releases trending
- detail d'une release
- lecture preview / full selon entitlement
- affichage artistes
- follow / unfollow
- commentaires
- recherche
- notifications in-app

### Fonctionnalites a reporter apres MVP

- upload artiste
- dashboard business complet
- e-commerce complet du site records
- analytics artiste avancees
- gestion agency/staff/admin
- asset packs et fonctions premium secondaires

## Ecarts techniques a corriger avant implementation mobile

### 1. Standardiser l'auth mobile

Etat actuel:

- le backend accepte bien un bearer token
- mais `login` et `refresh` renvoient surtout le user et posent les cookies

Recommendation:

- conserver le comportement web actuel
- ajouter un mode mobile explicite sur `login` et `refresh`
- renvoyer `accessToken`, `refreshToken` et `user` dans la reponse JSON quand le client est mobile

Exemple de contrat cible:

```json
{
  "user": { "id": "..." },
  "accessToken": "...",
  "refreshToken": "..."
}
```

Sans cette clarification, le mobile devra s'appuyer sur des comportements implicites du backend, ce qui est fragile.

### 2. Ajouter une API mobile pour les push devices

Endpoints a creer:

- `POST /api/mobile/devices`
- `DELETE /api/mobile/devices/:id`
- `GET /api/mobile/me`

Payload minimal:

```json
{
  "token": "expo-or-fcm-or-apns-token",
  "platform": "ios",
  "appVersion": "1.0.0",
  "deviceName": "iPhone 15"
}
```

### 3. Clarifier le contrat de playback

Le mobile a besoin d'une reponse claire pour le player:

```json
{
  "scope": "preview",
  "streamUrl": "https://...",
  "expiresAt": "2026-03-09T12:00:00.000Z"
}
```

Si ce contrat existe deja dans `StreamService`, il faut le documenter proprement pour l'app mobile.
Sinon, il faut le stabiliser avant de brancher le player natif.

### 4. Creer une couche API mobile typed

Le repo contient deja une logique de consommation API dans `frontend/lib/api.ts`.
Il faut s'en inspirer, mais ne pas la reutiliser telle quelle en mobile car elle depend:

- des cookies web
- du runtime Next.js
- de conventions SSR/fallback propres au site

Le bon modele est:

- extraire les types partages dans un package commun plus tard
- recreer un client mobile simple et explicite au debut

## Roadmap technique recommandee

### Phase 1 - cadrage backend

- stabiliser l'auth JSON mobile
- definir les reponses stream consumees par l'app
- ajouter l'enregistrement des devices push
- documenter les endpoints utilises par le mobile

### Phase 2 - fondation app mobile

- creer `mobile/` sous Expo
- configurer navigation, theme, bootstrap session
- creer client API + secure token storage
- integrer React Query

### Phase 3 - parcours utilisateur principal

- login
- home releases / trending
- detail release
- player audio
- detail artiste
- follows
- commentaires

### Phase 4 - engagement

- recherche
- notifications in-app
- push notifications
- bibliotheque / follows / historique

### Phase 5 - durcissement

- gestion offline minimale
- reprise session robuste
- analytics d'erreur
- crash reporting
- tests end-to-end des parcours critiques

## Decision d'implementation

### Ce qu'il faut reutiliser

- backend NestJS
- schema Prisma
- logique de streaming securise
- contrats de releases/artists/comments/follows/notifications
- direction produit du `music-web`

### Ce qu'il ne faut pas reutiliser tel quel

- le client `music-web/server.js`
- les patterns d'auth purement cookies du site web
- la logique de fallback SSR de `frontend/lib/api.ts`

## Risques principaux

### Risque 1 - audio HLS mobile

Le point critique du MVP n'est pas l'UI, c'est la lecture HLS securisee avec renouvellement propre des tokens si besoin.

### Risque 2 - confusion entre site records et app musique

Le mobile doit etre pense comme une experience `music-first`, pas comme une copie du dashboard web.

### Risque 3 - push incomplet

Le modele de base existe, mais pas la plomberie produit complete.

## Recommandation finale

La meilleure trajectoire est:

1. garder le backend actuel comme source unique
2. ajouter une mince couche mobile-specifique pour auth + push + contrats playback
3. lancer une app Expo centree sur streaming, decouverte et engagement
4. reporter toutes les fonctions business complexes apres le MVP

## References utiles dans le depot

- `backend/src/main.ts`
- `backend/src/modules/auth/auth.controller.ts`
- `backend/src/modules/auth/jwt.strategy.ts`
- `backend/src/modules/releases/releases.controller.ts`
- `backend/src/modules/stream/stream.controller.ts`
- `backend/src/modules/artists/artists.controller.ts`
- `backend/src/modules/comments/comments.controller.ts`
- `backend/src/modules/follows/follows.controller.ts`
- `backend/src/modules/notifications/notifications.controller.ts`
- `backend/src/modules/search/search.controller.ts`
- `backend/prisma/schema.prisma`
- `frontend/lib/api.ts`
- `music-web/server.js`

## Suite recommandee

Prochaine etape utile dans ce depot:

- creer un dossier `mobile/` Expo
- ajouter un `backend/src/modules/mobile`
- formaliser les endpoints JSON d'auth mobile
- brancher un premier player sur les releases existantes
