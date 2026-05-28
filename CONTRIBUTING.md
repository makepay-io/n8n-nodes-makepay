# Contributing

Thanks for helping improve the MakePay n8n community node.

## Development

1. Update node properties or execution behavior under `nodes/`.
2. Update credential behavior under `credentials/` only when authentication changes.
3. Run `npm run validate`.
4. Test changed operations inside a local n8n instance.

Do not commit MakePay partner keys, n8n credential exports, production workflow executions, or webhook payloads containing merchant or payer data.
