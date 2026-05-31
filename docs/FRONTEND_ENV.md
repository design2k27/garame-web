# Configuration environnement front

Le front utilise Vite. Seules les variables prefixees par `VITE_` sont exposees au code navigateur.

## Fichiers

- `.env`: configuration partagee par defaut, actuellement pointee vers l'API distante.
- `.env.example`: exemple a copier.
- `.env.local`: surcharge locale non versionnee, prioritaire en developpement.

## API locale

Pour travailler contre le serveur API local:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Verification effectuee le 2026-05-31:

```text
GET http://127.0.0.1:8000/health -> 200 {"status":"ok"}
```

Apres modification d'un fichier `.env*`, redemarrer le serveur Vite pour que la variable soit relue.
