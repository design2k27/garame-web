# Suivi des modifications API

Ce fichier doit etre mis a jour a chaque modification effectuee dans `garame-api`.

Pour chaque changement, renseigner:

- date
- fichiers API modifies
- endpoints ou payloads impactes
- raison du changement
- impact attendu cote front
- tests ou verification effectues

## 2026-05-30

### Initialisation du suivi

- Fichiers API modifies: aucun
- Endpoints impactes: aucun
- Raison: ajout d'un journal de suivi demande pour tracer les futures modifications API.
- Impact cote front: aucun
- Verification: inspection du dossier `garame-api`, du contrat routes/payloads, de CORS et de Mercure.

### Observations de compatibilite front/API

- Le front peut deja utiliser l'API existante pour auth, lobby, matchmaking, parties, profil, historique et classement.
- Le front doit convertir les couleurs de cartes entre son format UI (`hearts`, `diamonds`, `clubs`, `spades`) et le format API (`H`, `D`, `C`, `S`).
- Le front affiche actuellement des mises et un wallet en euros, alors que l'API expose des credits de jeu et ne fournit pas de routes wallet/depot/retrait.
- Si les mises en euros sont conservees comme fonctionnalite produit, il faudra ajouter un contrat API dedie avant de connecter cette partie du front.
- Le temps reel Mercure est publie sur le topic `game/{gameId}`, mais le front devra connaitre l'URL publique du hub via configuration ou endpoint dedie. En attendant, le polling `/api/games/{id}/poll` suffit pour connecter la table de jeu.

## 2026-05-31

### Reapplication sur la nouvelle copie API

- Fichiers API modifies:
  - `garame-api/src/Entity/Game.php`
  - `garame-api/src/Service/GameApplicationService.php`
  - `garame-api/src/Controller/GameController.php`
  - `garame-api/migrations/Version20260531160000.php`
- Endpoint ajoute/restaure: `POST /api/games/{id}/rematch`
- Payload de reponse:
  - premier joueur a demander: `{ action: "rematch_waiting", status: "waiting", originalGameId, game: null, result: null }`
  - deuxieme joueur a demander ou polling apres creation: `{ action: "rematch_started", status: "started", originalGameId, game, result }`
- Persistance ajoutee sur `game`:
  - `rematch_requests` JSON
  - `rematch_game_id` UUID nullable
- Raison: la nouvelle copie de `garame-api` contenait deja le contrat de sync/matchmaking/profil, mais pas encore le contrat de revanche utilise par le front.
- Impact cote front: les boutons de fin de partie "Demander une revanche" peuvent fonctionner contre l'API locale.
- Verification:
  - `php -l` sur les fichiers PHP modifies
  - `pnpm run build`
  - `php bin/console doctrine:migrations:migrate --no-interaction`

### Revanche synchronisee apres fin de partie

- Fichiers API modifies:
  - `garame-api/src/Entity/Game.php`
  - `garame-api/src/Service/GameApplicationService.php`
  - `garame-api/src/Controller/GameController.php`
  - `garame-api/migrations/Version20260531090000.php`
- Endpoint ajoute: `POST /api/games/{id}/rematch`
- Payload de reponse:
  - premier joueur a demander: `{ action: "rematch_waiting", status: "waiting", originalGameId, game: null, result: null }`
  - deuxieme joueur a demander ou polling apres creation: `{ action: "rematch_started", status: "started", originalGameId, game, result }`
- Persistance ajoutee sur `game`:
  - `rematch_requests` JSON, liste des IDs utilisateurs ayant demande la revanche
  - `rematch_game_id` UUID nullable, nouvelle partie creee lorsque les deux joueurs ont demande la revanche
- Raison: connecter le bouton de fin de partie et permettre une revanche uniquement si les deux adversaires la demandent.
- Impact cote front:
  - les modales de fin de partie peuvent appeler `POST /api/games/{id}/rematch`
  - si `status=waiting`, le client reposte periodiquement jusqu'a `status=started`
  - si `status=started`, le client navigue vers `/game/{game.id}`
- Verification:
  - `php -l` sur les fichiers PHP modifies
  - `pnpm run build` cote front

### Restauration apres rollback de `garame-api`

- Fichiers API modifies/restaures:
  - `garame-api/.env.local`
  - `garame-api/src/Entity/User.php`
  - `garame-api/src/Entity/Game.php`
  - `garame-api/src/Entity/GamePlayer.php`
  - `garame-api/src/Repository/GameRepository.php`
  - `garame-api/src/Controller/AuthController.php`
  - `garame-api/src/Controller/GameController.php`
  - `garame-api/src/Controller/MoveController.php`
  - `garame-api/src/Controller/ProfileController.php`
  - `garame-api/src/Controller/RankingController.php`
  - `garame-api/src/Service/GameEngine.php`
  - `garame-api/migrations/Version20260531143000.php`
- Endpoints restaures/ajoutes pour compatibilite front:
  - `POST /api/games/matchmaking`
  - `POST /api/games/matchmaking/cancel`
  - `GET /api/games/my/history`
  - `GET /api/games/{id}/sync`
  - `GET /api/games/{id}/poll`
  - `POST /api/games/{id}/ack`
  - `POST /api/games/{id}/rematch`
  - `GET /api/profile/stats`
  - `GET /api/ranking`
- Champs restaures:
  - `user.credits`
  - `game.stateVersion`
  - `game.isMatchmakingQueue`
  - `game.rematchRequests`
  - `game.rematchGameId`
  - `gamePlayer.lastAckedStateVersion`
  - `gamePlayer.lastSeenAt`
- Raison: le dossier `garame-api` avait ete rollback vers un contrat plus ancien incompatible avec le front actuel.
- Impact cote front: les appels deja branches dans le front retrouvent les routes et payloads attendus.
- Verification:
  - `php -l` sur les fichiers PHP modifies
  - `php bin/console lexik:jwt:check-config`
  - `pnpm run build`
  - migration non appliquee: PostgreSQL local ne repondait pas sur `127.0.0.1:5432`
