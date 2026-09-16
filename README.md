# Standarde digitale

Verificare independentă a site-urilor de agenți Dacia, pe grila de conformitate website 2026.

Nu este un audit oficial Dacia / Renault / TNP.

## Local

```bash
npm install
npm test
npm run dev
```

Chrome trebuie instalat pentru scanarea live (`playwright-core` cu `channel: "chrome"`).

## Producție (Vercel)

- Runtime Node.js, `AWS_LAMBDA_JS_RUNTIME=nodejs22.x`
- `BLOB_READ_WRITE_TOKEN` pentru linkuri permanente de raport
- `RESEND_API_KEY` + `LEAD_TO_EMAIL` (email de pe `hello@updates.vreau-site.ro`)
- `NEXT_PUBLIC_SITE_URL`

Funcția `/api/audit` are 60s / 3008 MB, Fluid Compute oprit (Chromium).
