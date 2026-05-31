# Setup API locale

Notes utiles pour lancer `garame-api` en local avec le front.

## URL front

Le front local pointe vers:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## JWT local

Si `/api/auth/login` ou `/api/auth/register` retourne une erreur 500 avec:

```text
JWTEncodeFailureException
Please verify your configuration (private key/passphrase)
```

verifier que les fichiers suivants existent:

```text
garame-api/config/jwt/private.pem
garame-api/config/jwt/public.pem
```

Sur Windows, PHP peut chercher `openssl.cnf` dans un chemin inexistant. Dans ce cas, generer les cles avec:

```powershell
$env:OPENSSL_CONF='C:\PHP\8.4\extras\ssl\openssl.cnf'
php bin\console lexik:jwt:generate-keypair --overwrite --no-interaction
php bin\console lexik:jwt:check-config
```

Ajouter aussi cette variable dans `garame-api/.env.local` pour que le serveur web local utilise la meme configuration OpenSSL:

```env
OPENSSL_CONF=C:/PHP/8.4/extras/ssl/openssl.cnf
```

Apres modification de `.env.local`, redemarrer le serveur API local.

Verification effectuee le 2026-05-31:

```text
php bin\console lexik:jwt:check-config -> The configuration seems correct.
POST /api/auth/register -> 201
POST /api/auth/login -> 200
```

Les cles JWT sont des fichiers locaux de developpement. Ne pas les reutiliser en production.

## Migration locale

Apres restauration ou modification de `garame-api`, appliquer les migrations:

```powershell
cd garame-api
php bin\console doctrine:migrations:migrate --no-interaction
```

Si la commande retourne `connection refused` sur `127.0.0.1:5432`, relancer d'abord PostgreSQL ou la stack Docker de l'API.
