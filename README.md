# apass-verify (Render)

A tiny REST service for Galxe REST Credential. Returns `1` if a wallet has interacted with a given Solana **Program ID** on **devnet** (or the RPC you configure), otherwise `0`.

## Endpoints
- `GET /verify?address=<wallet>` (expects header `X-Auth-Token: <SHARED_TOKEN>`)
  - Response body: `"1"` or `"0"`
- `GET /health` — quick RPC health check

## Env Vars (Render → Settings → Environment)
- `PROGRAM_ID` — your Solana program address (devnet)
- `RPC_URL` — e.g. `https://api.devnet.solana.com` or your provider's devnet endpoint
- `SHARED_TOKEN` — e.g. `cleanverse` (same header must be sent by Galxe)
- `MIN_CALLS` — default `1`
- Optional: `START_AT`, `END_AT` (ISO8601), `MAX_PAGES` (default `4`)

## Render Setup
1. Create a **Web Service** on Render (Node 18+).
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Set the env vars above and **Deploy**.

## Galxe REST Credential
- Method: `GET`
- URL: `https://<your-render-service>.onrender.com/verify`
- Query: `address`
- Header: `X-Auth-Token: <SHARED_TOKEN>`
- Success mapping: body `"1"` → pass, `"0"` → fail

## Local test
```bash
curl -i -H "X-Auth-Token: cleanverse"   "https://<your-render-service>.onrender.com/verify?address=<WALLET_ADDR>"
```
