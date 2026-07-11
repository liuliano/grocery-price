# BasketIQ Refresh Worker

This Worker keeps the GitHub token off the public BasketIQ website.

## Required Cloudflare secrets

- `GITHUB_TOKEN`: fine-grained GitHub token restricted to `liuliano/grocery-price`
  - Actions: read and write
  - Contents: read and write

## GitHub repository secrets for deployment

Add these under **Settings → Secrets and variables → Actions**:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## First deployment

1. Create a Cloudflare Workers account.
2. Create an API token that can edit Workers Scripts.
3. Add the two deployment secrets above to GitHub.
4. Run **Deploy BasketIQ refresh worker** in GitHub Actions.
5. In Cloudflare, add the Worker secret:

   ```bash
   cd worker
   npx wrangler secret put GITHUB_TOKEN
   ```

6. Copy the resulting `workers.dev` URL.
7. Set that URL in `js/config.js` as `refreshEndpoint`.

The frontend should call:

- `POST <worker-url>/refresh` with `{ "items": [...], "zipCode": "33579" }`
- `POST <worker-url>/inventory` with `{ "items": [...] }`
