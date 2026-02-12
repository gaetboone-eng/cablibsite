# Cablib - Product Requirements Document

## Original Problem Statement
Création d'une plateforme web "Cablib" pour la location de cabinets médicaux et paramédicaux, inspirée de l'expérience utilisateur Doctolib.

## User Personas
1. **Locataires (Practitioners)**: Professionnels de santé recherchant un local médical à louer
2. **Propriétaires (Owners)**: Propriétaires de locaux médicaux proposant leurs espaces
3. **Administrateurs**: Gestionnaires de la plateforme validant les profils

## Core Requirements
- Design sophistiqué avec palette beige (#F5F0E6) et bleu nuit (#1A1F3D)
- Authentification utilisateurs (locataires, propriétaires, admin)
- Recherche par géolocalisation avec rayon et carte interactive
- Filtres avancés spécifiques aux pratiques médicales
- Système de vérification RPPS avec accès restreint
- Dashboard statistiques pour propriétaires
- Messagerie intégrée avec templates pré-remplis

## What's Been Implemented

### Authentication & User Management ✅
- Inscription avec numéro RPPS optionnel
- Vérification automatique si RPPS valide (11 chiffres)
- Statut "pending" pour utilisateurs sans RPPS
- Profession "Autre" pour pratiques non conventionnelles
- Panel admin pour validation/rejet des profils
- Accès restreint (contacter/postuler) pour non-vérifiés
- **Testé et validé le 13/02/2026**

### Listings & Search ✅
- Création d'annonces avec upload direct de photos
- Recherche par ville avec rayon (formule Haversine)
- Filtres avancés: équipements, PMR, parking
- Score de matching AI entre locataires et annonces

### Communication ✅
- Messagerie intégrée avec conversations
- Templates de messages pré-remplis
- Planification de visites

### Analytics ✅
- Dashboard propriétaire: vues, contacts, favoris, conversions
- Heatmap recherches par ville (admin)

### UI/UX ✅
- Design beige/bleu nuit
- Logo avec police Dancing Script
- Interface responsive et moderne

## Prioritized Backlog

### P1 - High Priority
- [ ] Comparaison côte-à-côte des annonces favorites
- [ ] Enrichissement profils propriétaires (taux de réponse, bio)

### P2 - Medium Priority  
- [ ] Points d'intérêt sur carte (pharmacies, hôpitaux)
- [ ] Recherche par temps de trajet (isochrone)

### P3 - Low Priority
- [ ] Notifications email réelles (attente SMTP)
- [ ] Visites virtuelles 360°
- [ ] Recherche par tracé sur carte

## Technical Architecture
- **Backend**: FastAPI + MongoDB (motor)
- **Frontend**: React + TailwindCSS
- **Auth**: JWT tokens
- **Files**: Upload direct avec aiofiles

## Key Credentials (Test)
- Admin: admin@test.fr / test123
- Propriétaire: proprietaire@test.fr / test123  
- Locataire: locataire@test.fr / test123

## Known Limitations
- **MOCKED**: Notifications email (en attente config SMTP)
- Backend monolithique (server.py) - refactoring recommandé

## Last Updated
13 Février 2026 - Tests flux inscription utilisateur validés
