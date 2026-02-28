# Steg 2: Admin-panelen — Installationsinstruktioner

## Så här lägger du till Steg 2 i ditt projekt:

### 1. Kopiera API-routes
Kopiera hela mappen `app/api/admin/` till ditt projekt:
- `app/api/admin/applications/route.ts`
- `app/api/admin/members/route.ts`
- `app/api/admin/statistics/route.ts`
- `app/api/admin/events/route.ts`

### 2. Ersätt admin-sidan
Ersätt filen `app/admin/page.tsx` med den nya versionen.

### 3. Push + deploy
```bash
cd clubfreja
git add .
git commit -m "Steg 2: Admin-panel"
git push
```
Vercel deployer automatiskt!

### 4. Testa
Logga in som admin (admin@clubfreja.se / Admin123!) och testa:
- ✅ Ansökningar — Godkänn/neka väntande användare
- ✅ Medlemmar — Tabell med alla, radera-knapp
- ✅ Statistik — Könsfördelning, län, ålderskategorier
- ✅ Skapa Event — Skapa/radera evenemang
