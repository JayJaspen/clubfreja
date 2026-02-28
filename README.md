# Club Freja — Södra Sveriges hemligaste sällskap

## 🚀 Deploy till Vercel

### 1. Installera + Git
```bash
cd clubfreja
npm install
git init
git add .
git commit -m "Steg 1: Grundstomme"
```

### 2. Pusha till GitHub
Skapa repo på github.com (Private), sedan:
```bash
git branch -M main
git remote add origin https://github.com/DITT-NAMN/clubfreja.git
git push -u origin main
```

### 3. Vercel
1. [vercel.com](https://vercel.com) → New Project → importera från GitHub
2. Deploy

### 4. Lägg till Vercel Postgres
Projekt → **Storage** → **Create Database** → **Postgres**

### 5. Environment Variables
**Settings → Environment Variables:**

| Key | Value |
|-----|-------|
| `JWT_SECRET` | Lång hemlig sträng |
| `ELKS_API_USERNAME` | Från 46elks.com |
| `ELKS_API_PASSWORD` | Från 46elks.com |

### 6. Redeploy
Deployments → senaste → ⋯ → Redeploy

### 7. Skapa tabeller
Besök: `https://din-app.vercel.app/api/setup`

### 8. Koppla domän
Vercel → Settings → Domains → `clubfreja.se` + `www.clubfreja.se`

DNS hos din domänleverantör:
- CNAME: `www` → `cname.vercel-dns.com`
- A: `@` → `76.76.21.21`

### 9. Logga in
- **Admin:** admin@clubfreja.se / Admin123!
- ⚠️ Byt lösenord!

## ✅ Steg 1 innehåller
- [x] Next.js 14 + TypeScript
- [x] Vercel Postgres (8 tabeller)
- [x] Landningssida (svart/guld design)
- [x] Registrering med SMS-verifiering (46elks)
- [x] Login med pending/approved/rejected-kontroll
- [x] JWT auth med httpOnly cookies
- [x] Admin auth guard
- [x] noindex/nofollow (hemlig sida)

## 🔜 Nästa steg
- **Steg 2:** Admin-panel (Ansökningar, Medlemmar, Statistik, Skapa Event)
- **Steg 3:** Användar-dashboard (Översikt, Medlemmar, Chat, Communities, Evenemang, Min Profil)
