# Vercel development and production workflow

The repository uses Vercel for the Next.js control-plane application. Keep local development, Preview, and Production environments distinct.

## Local development

Run these commands from the repository root:

```bash
npm i -g vercel
vercel link
vercel env pull .env.local
npm install
npm run build
npm run dev
```

`vercel link` associates the local checkout with the existing `insta-floan` Vercel project. `vercel env pull` downloads the Development environment variables into the local file specified above. Do not commit `.vercel/` or local `.env*` files.

## Preview validation

Push a feature branch or open/update a pull request. Vercel Git integration creates a Preview deployment for the branch. Validate the Preview before promoting anything to Production:

1. deployment reaches `READY`;
2. dashboard loads without runtime errors;
3. `/api/health` returns healthy;
4. `/api/scan` returns explicit readiness/assurance state;
5. live quote configuration is explicit and verified;
6. no real transaction is submitted by scanning;
7. real execution gates remain fail-closed.

## Production

Production is only the user-facing deployment. The canonical production branch is `main`. Production deployment can be triggered by the Git integration or explicitly from a linked local checkout:

```bash
vercel pull --yes --environment=production
vercel build --prod
vercel deploy --prebuilt --prod
```

For an already validated Preview, promotion is preferable because it promotes the exact artifact that was tested:

```bash
vercel promote <validated-preview-url-or-id>
```

Do not use `vercel --prod` or `vercel promote` as a substitute for controlled-fork execution validation. Deployment health and trading authorization are separate gates.

## Secrets and execution safety

Production credentials must remain in Vercel environment variables/secrets and GitHub Actions secrets. Never commit a Vercel token, private key, seed phrase, RPC credential, or other secret.

`LIVE_EXECUTION` remains disabled by default. A healthy deployment means the application builds, serves, reports its readiness accurately, and remains fail-closed when trading prerequisites are not satisfied; it does **not** mean that real execution is authorized.

## Current project IDs

- Project: `insta-floan`
- Project ID: `prj_vzRQ7tmPR0id7Ym1lhCgyRfuQqnM`
- Team ID: `team_YnYjiqv2j4c106mr6BorOBFL`

These identifiers are not credentials and may be used by CI configuration. The deployment token itself must stay secret.
