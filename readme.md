### Csomor Tamás - 2026. március 1.

## Fényképalbum

### Frontend

React, Tailwind CSS

### Backend

Node.js, Express, PostgreSQL

### Deployment

Heroku (https://csomor-paas-fenykepalbum-3872bd2f225d.herokuapp.com/)

### Skálázhatóság

Az alkalmazás skálázhatóságához ezek a lépések készültek el:

1. Session store Redis-ben (dyno-k között megosztva)
2. Képtárolás Cloudinary-ben (Postgres blob helyett)
3. Lekérdezési terhelés csökkentése:
    - Fotólista lapozása: 10 kép/lap
    - Auth és upload endpointok rate limitinggel védettek.

### Code

https://github.com/csomortamas/csomor-paas-fenykepalbum/tree/master