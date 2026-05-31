# Documentation Technique Garame API

Ce dossier regroupe la documentation fonctionnelle et technique du backend Garame.

## Sommaire

- [`API.md`](./API.md): contrat HTTP public, endpoints, payloads, erreurs et regles exposees.
- [`RealtimeClient.md`](./RealtimeClient.md): contrat temps reel cote frontend, Mercure, `sync`, `poll`, `ack`.
- [`Architecture.md`](./Architecture.md): vue d'ensemble de l'architecture applicative et des flux metier principaux.
- [`Entities.md`](./Entities.md): description detaillee du modele de donnees Doctrine.
- [`Services.md`](./Services.md): role et interactions des services metier.
- [`Routes.md`](./Routes.md): cartographie des routes HTTP avec controleurs, services et reponses.
- [`API_MODIFICATIONS.md`](./API_MODIFICATIONS.md): journal a mettre a jour a chaque modification du code API dans `garame-api`.
- [`FRONTEND_ENV.md`](./FRONTEND_ENV.md): configuration des variables d'environnement du front.
- [`API_LOCAL_SETUP.md`](./API_LOCAL_SETUP.md): notes de setup pour l'API locale, notamment les cles JWT.
- [`UX_UI_AMELIORATION_PLAN.md`](./UX_UI_AMELIORATION_PLAN.md): plan iteratif d'amelioration de l'experience, du design et du tour de jeu.

## Lecture recommandee

Pour comprendre rapidement le projet:

1. Lire [`Architecture.md`](./Architecture.md)
2. Lire [`Entities.md`](./Entities.md)
3. Lire [`Services.md`](./Services.md)
4. Completer avec [`Routes.md`](./Routes.md) et [`API.md`](./API.md)
5. Consulter [`API_MODIFICATIONS.md`](./API_MODIFICATIONS.md) pour les ecarts introduits apres le contrat initial.

## Portee

La documentation est alignee sur l'etat courant du code dans `garame-api/src/`.
Elle documente le comportement reellement implemente, pas une cible produit future.
