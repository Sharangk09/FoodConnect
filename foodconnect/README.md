# FoodConnect – Connecting Food with People in Need
Restaurants list surplus food; NGOs request it. React + Tailwind, Express, MongoDB, JWT, bcrypt.

## Setup
1. Install MongoDB locally or create a free MongoDB Atlas cluster.
2. `cd server && cp .env.example .env` → set `MONGO_URI` and a long random `JWT_SECRET`.
3. `npm install && npm start` (API on :5000)
4. In a second terminal: `cd client && npm install && npm run dev` (app on :5173, proxies /api to :5000)
5. Open http://localhost:5173 and register a Restaurant account and an NGO account (use two browsers/profiles to test both sides).

No accounts or data are pre-seeded; every number comes from the database.
