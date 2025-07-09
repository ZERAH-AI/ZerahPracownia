# Railway Dust + Chatwoot Integration

Integracja między Dust AI Agent a Chatwoot dla automatycznych odpowiedzi.

## Setup

### Railway Deployment
1. Fork tego repo
2. Połącz z Railway
3. Ustaw environment variables w Railway dashboard:
   - `DUST_WORKSPACE_ID`
   - `DUST_API_KEY`
   - `DUST_NAME`
   - `CHATWOOT_ACCOUNT_ID`
   - `CHATWOOT_API_KEY`
   - `CHATWOOT_API_URL`
   - `PORT`

### Local Development
1. `npm install`
2. Skopiuj `.env.example` do `.env`
3. Wypełnij swoje dane w `.env`
4. `npm run dev`

## Endpoints

- `POST /webhook/chatwoot` - Webhook dla Chatwoot
- `POST /webhook/dust` - Bezpośredni webhook dla Dust
- `GET /test` - Test Dust connection
- `GET /test/chatwoot` - Test Chatwoot connection
- `GET /health` - Health check

## Chatwoot Setup

1. Idź do Settings > Integrations > Webhooks
2. Dodaj webhook URL: `https://your-app.railway.app/webhook/chatwoot`
3. Wybierz event: `message_created`

## Environment Variables

Wszystkie wymagane zmienne są w `.env.example`
