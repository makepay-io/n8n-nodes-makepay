# Security Policy

## Reporting

Report security issues to info@makepay.io.

## Credentials

- Store MakePay key secrets only in n8n credentials.
- Do not log key secrets, workflow credentials, or raw production webhook payloads.
- Rotate MakePay partner keys if an n8n credential export is exposed.

## Publishing

Use npm provenance from GitHub Actions for public package releases. Keep npm automation tokens scoped to this package.
