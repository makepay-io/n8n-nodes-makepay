# n8n Nodes for MakePay

Community node package for using MakePay in n8n workflows.

## Operations

- Payment Link: create, get, get many
- Customer: create or update
- Bookkeeping Invoice: create, create payment link
- Webhook Request: get many
- API: make a custom MakePay partner API request

## Credentials

Create a MakePay credential in n8n with:

- MakePay Key ID
- MakePay Key Secret
- Partner API Base URL, normally `https://www.makecrypto.io`

The credential sends `X-MakeCrypto-Key-Id` and `X-MakeCrypto-Key-Secret` headers on authenticated MakePay partner API requests.

## Install in n8n

When published to npm, install with:

```sh
npm install n8n-nodes-makepay
```

For local development:

```sh
npm ci
npm run build
npm link
```

Then link the package into an n8n development instance.

## Validate

```sh
npm ci
npm run validate
```

The validation command runs n8n's linter, builds the node package, scans for forbidden identifiers and committed secrets, and checks the npm package contents with `npm pack --dry-run`.
