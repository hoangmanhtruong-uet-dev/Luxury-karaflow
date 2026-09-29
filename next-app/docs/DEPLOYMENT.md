# Deployment Manifest

## Platform: Render

### Service Configuration

```yaml
# render.yaml
services:
  - type: web
    name: web-karaoke
    runtime: node
    plan: starter
    buildCommand: npm --prefix next-app ci && npm run build
    startCommand: npm run start
    healthCheckPath: /api/health/ready
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false
      - key: AUTH_SECRET
        sync: false
      - key: NEXT_PUBLIC_SITE_URL
        sync: false
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string with `sslmode=verify-full` |
| `AUTH_SECRET` | Yes | Auth.js session secret |
| `DATABASE_SSL_CA_BASE64` | Yes | Base64-encoded CA certificate |
| `PRODUCTION_CANONICAL_ORIGIN` | Yes | Canonical HTTPS origin |
| `AUTH_URL` | Yes | Must match canonical origin |
| `AUTH_TRUST_HOST` | Yes | Must be `true` |
| `TRUSTED_PROXY_MODE` | Yes | `vercel` or `cloudflare` |
| `NEXT_PUBLIC_SITE_URL` | Yes | Public HTTPS URL |
| `NEXT_PUBLIC_HOTLINE` | Yes | Real phone number |
| `CRON_SECRET` | Yes | For internal jobs |
| `TOTP_ENCRYPTION_KEY` | Yes | 32-byte base64 |
| `SECURITY_EVENT_HASH_SECRET` | Yes | For PII hashing |
| `RECOVERY_CODE_HASH_SECRET` | Yes | For 2FA recovery |

### Health Check

- **Live**: `GET /api/health/live` — returns 200 if process is running
- **Ready**: `GET /api/health/ready` — returns 200 if DB is reachable

### Scaling

- **Instances**: Start with 1, scale based on CPU/memory
- **Max instances**: 3 (to prevent DB connection exhaustion)
- **DB pool max**: 5 per instance

### Rollback

1. Go to Render dashboard → Service → Deploys
2. Find previous successful deploy
3. Click "Rollback" on that deploy
4. Verify health check passes after rollback
