# CabLib - Plateforme de Mise en Relation Médicale

CabLib est une plateforme web moderne qui met en relation les professionnels de santé (locataires) avec des structures médicales (maisons de santé, cabinets médicaux) proposées à la location.

## 🏥 Fonctionnalités Principales

### Pour les Locataires (Professionnels de Santé)
- **Recherche Avancée** : Recherchez des locaux par ville avec filtres (type de structure, surface, loyer, professions)
- **Vue Split** : Liste des annonces + Carte interactive OpenStreetMap
- **Favoris** : Sauvegardez vos annonces préférées
- **Dashboard** : Gérez vos favoris et recherches

### Pour les Propriétaires
- **Gestion d'Annonces** : Créez, modifiez et supprimez vos annonces
- **Visibilité** : Option "en vedette" pour mettre en avant vos annonces
- **Dashboard** : Vue d'ensemble de toutes vos annonces

### Sécurité
- **Authentification RPPS** : Validation du numéro RPPS (11 chiffres) pour garantir l'accès aux seuls professionnels de santé
- **JWT** : Authentification sécurisée avec tokens JWT

## 🎨 Design

- **Style Moderne** : Design professionnel avec palette émeraude/terracotta
- **Responsive** : Interface adaptée desktop, tablet et mobile
- **Polices** : Manrope (titres) + DM Sans (corps de texte)
- **Composants** : Shadcn UI pour une interface cohérente

## 🛠️ Stack Technique

### Backend
- **FastAPI** : Framework Python moderne et performant
- **MongoDB** : Base de données NoSQL avec Motor (async)
- **JWT** : Authentification sécurisée
- **Bcrypt** : Hachage des mots de passe

### Frontend
- **React 19** : Dernière version de React
- **React Router** : Navigation SPA
- **Tailwind CSS** : Styling utilitaire
- **React Leaflet** : Cartes interactives OpenStreetMap (gratuit)
- **Sonner** : Notifications toast élégantes
- **Axios** : Requêtes HTTP

## 📦 Installation et Démarrage

Les services sont déjà configurés et gérés par Supervisor.

### Backend
```bash
cd /app/backend
pip install -r requirements.txt
# Le backend démarre automatiquement sur http://0.0.0.0:8001
```

### Frontend
```bash
cd /app/frontend
yarn install
# Le frontend démarre automatiquement sur http://localhost:3000
```

### Redémarrer les services
```bash
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

## 🔌 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription avec validation RPPS
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil utilisateur

### Annonces
- `GET /api/listings` - Liste des annonces (avec filtres)
- `GET /api/listings/:id` - Détail d'une annonce
- `POST /api/listings` - Créer une annonce (propriétaire)
- `PUT /api/listings/:id` - Modifier une annonce
- `DELETE /api/listings/:id` - Supprimer une annonce

### Favoris
- `GET /api/favorites` - Liste des favoris
- `POST /api/favorites` - Ajouter un favori
- `DELETE /api/favorites/:listing_id` - Retirer un favori

## 📝 Variables d'Environnement

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
CORS_ORIGINS=*
SECRET_KEY=cablib-secret-key-2026-change-in-production
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://your-backend-url.com
```

## 🧪 Tests

3 annonces de test sont déjà créées dans la base de données :
- Cabinet médical lumineux - Paris
- MSP moderne - Lyon
- Cabinet spacieux - Marseille

### Comptes de test
```
Propriétaire:
Email: proprietaire@cablib.fr
Password: test123

Locataire:
Email: test@medecin.fr
Password: test123
```

## 🚀 Prochaines Étapes

### Phase de Monétisation (à venir)
- Intégration système de paiement (Stripe)
- Mise en avant payante des annonces (modèle LeBonCoin)
- Plans premium pour propriétaires

### Authentification RPPS Avancée (à venir)
- Validation RPPS via API externe
- Vérification approfondie des professionnels de santé

### Améliorations Futures
- Système de messagerie interne
- Notifications par email
- Export PDF des annonces
- Recherche géographique avancée avec rayon
- Statistiques détaillées pour propriétaires

## 📄 Structure du Projet

```
/app
├── backend/
│   ├── server.py          # API FastAPI
│   ├── requirements.txt   # Dépendances Python
│   └── .env              # Variables d'environnement
├── frontend/
│   ├── src/
│   │   ├── pages/        # Pages React
│   │   ├── components/   # Composants réutilisables
│   │   ├── App.js        # App principale
│   │   └── index.css     # Styles globaux
│   ├── package.json      # Dépendances Node
│   └── .env             # Variables d'environnement
└── README.md            # Ce fichier
```

## 💡 Notes Techniques

- **Carte Gratuite** : Utilisation d'OpenStreetMap au lieu de Google Maps pour réduire les coûts
- **Géocodage** : Cache en mémoire pour les coordonnées des villes principales
- **Hot Reload** : Rechargement automatique en développement
- **CORS** : Configuré pour accepter toutes les origines en développement

## 🤝 Support

Pour toute question ou assistance, contactez l'équipe CabLib.

---

**CabLib** © 2026 - Plateforme de mise en relation pour professionnels de santé
