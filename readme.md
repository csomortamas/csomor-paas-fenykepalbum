### Csomor Tamás - 2026. március 1.

## Fényképalbum

### Frontend

React, Tailwind CSS

### Backend

Node.js, Express, PostgreSQL

### Deployment

Heroku (https://csomor-paas-fenykepalbum-3872bd2f225d.herokuapp.com/)

### Skálázható Heroku beállítás

Az alkalmazás több web dyno-val futtatható, mert a session adatok Redis-ben vannak tárolva (nem memóriában).

### Képtárolás Cloudinary-ben (Heroku-barát)

A képek nem PostgreSQL-ben, hanem Cloudinary-ben vannak tárolva. Az adatbázis csak a kép URL-jét és a Cloudinary azonosítót menti.

#### Miért ez a legegyszerűbb Heroku integráció?

- Van hivatalos Heroku addon.
- Automatikusan ad `CLOUDINARY_URL` config var-t.
- Nem kell saját object storage bucketet és IAM jogosultságot kezelni.

#### Szükséges lépések

1. Cloudinary addon bekötése:

```bash
heroku addons:create cloudinary:starter --app csomor-paas-fenykepalbum
```

2. Ellenőrzés, hogy megvan a környezeti változó:

```bash
heroku config --app csomor-paas-fenykepalbum | grep CLOUDINARY_URL
```

3. Deploy a módosított kóddal (`master` auto deploy vagy manuális push).

4. A release folyamat automatikusan frissíti a táblát új oszlopokkal (`image_url`, `image_public_id`).

#### Megjegyzés régi adatokhoz

- A régi, base64-es rekordok továbbra is megjelennek (fallback).
- Az új feltöltések már Cloudinary-be mennek.
- Ha szeretnéd, később lehet külön migrációt írni a régi képek teljes átköltöztetésére.

### Code

https://github.com/csomortamas/csomor-paas-fenykepalbum/tree/master