# DevOps Deployment Architecture

## 1. Architecture

The project is a Turborepo monorepo deployed on two AWS EC2 servers.

### DEV

- Branch: `main`
- EC2: DEV
- Nginx: port 80
- Next.js: port 3002
- HTTP API: port 3000
- WebSocket: port 3001
- Database: DEV database

### PROD

- Branch: `prod`
- EC2: PROD
- Nginx: port 80
- Next.js: port 3002
- HTTP API: port 3000
- WebSocket: port 3001
- Database: PROD database

## 2. Release Flow

```text
feature branch
      ↓
Pull Request
      ↓
main
      ↓
GitHub Actions CI
      ↓
DEV EC2
      ↓
DEV testing
      ↓
Promotion PR
      ↓
prod
      ↓
GitHub Actions CI
      ↓
PROD EC2
      ↓
Production verification
```

## 3. Branches

- `main` — development/release candidate branch
- `prod` — production branch
- `feature/*` — temporary branches used for individual changes

## 4. Nginx Routing

- `/` → Next.js `:3002`
- `/api/` → HTTP API `:3000`
- `/ws/` → WebSocket `:3001`

The HTTP and WebSocket applications listen only on their application ports. Nginx acts as the public reverse proxy.

## 5. Process Management

PM2 manages three processes on each EC2:

- `http-server`
- `ws-server`
- `web`

PM2 is configured to:

- Keep processes running
- Restart crashed processes
- Restore processes after EC2 reboot

## 6. DEV Deployment

GitHub Actions is triggered when `main` changes.

The deployment workflow:

```bash
git pull origin main
pnpm install
pnpm build
pm2 restart http-server
pm2 restart ws-server
pm2 restart web
```

## 7. PROD Deployment

GitHub Actions is triggered when `prod` changes.

The deployment workflow:

```bash
git pull origin prod
pnpm install
pnpm build
pm2 restart http-server
pm2 restart ws-server
pm2 restart web
```

## 8. Environment Variables

Environment files are kept on the respective EC2 servers.

- DEV → `packages/prisma/.env` → DEV database
- PROD → `packages/prisma/.env` → PROD database

Database credentials and SSH keys are not committed to Git. GitHub deployment credentials are stored using GitHub Actions Secrets.

## 9. Deployment Verification

### DEV

Frontend:
```bash
curl http://16.176.129.66/
```

API:
```bash
curl http://16.176.129.66/api/users
```

WebSocket:
```bash
npx wscat -c ws://16.176.129.66/ws/
```

### PROD

Frontend:
```bash
curl http://13.211.140.115/
```

API:
```bash
curl http://13.211.140.115/api/users
```

WebSocket:
```bash
npx wscat -c ws://13.211.140.115/ws/
```

## 10. Rollback Procedure

If a deployment introduces a problem:

1. Identify the last known-good commit.
2. Move the affected deployment branch back to that commit.
3. Push the branch.
4. GitHub Actions automatically deploys the selected commit.
5. Verify the affected services.

Example:

```bash
git switch prod
git log --oneline
git reset --hard <KNOWN_GOOD_COMMIT>
git push --force-with-lease origin prod
```

> **Note:** Use `--force-with-lease` carefully and only when intentionally rolling the deployment branch back.

After rollback, check status:

```bash
pm2 status
```

Then verify:

```bash
curl http://13.211.140.115/
curl http://13.211.140.115/api/users
```

And test WebSocket connectivity again.

## 11. Current Deployment Model

```text
                    GitHub
                       │
             ┌─────────┴─────────┐
             │                   │
           main                prod
             │                   │
             ▼                   ▼
          DEV EC2             PROD EC2
             │                   │
           Nginx               Nginx
             │                   │
       ┌─────┼─────┐       ┌─────┼─────┐
       │     │     │       │     │     │
      FE    HTTP   WS      FE    HTTP   WS
     3002   3000  3001    3002   3000  3001
       │     │     │       │     │     │
       └─────┴─────┘       └─────┴─────┘
             │                   │
           DEV DB              PROD DB
```

## 12. HTTPS

The current deployment uses public EC2 IP addresses and HTTP/WS. Domains and HTTPS/WSS were not configured in this deployment.

## 13. Final Status

- DEV CI/CD: complete
- PROD CI/CD: complete
- Feature → main release flow: complete
- main → prod promotion flow: complete
- Final DEV testing: complete
- Final PROD testing: complete
- PM2 reboot recovery: complete
- Operational checks: complete
