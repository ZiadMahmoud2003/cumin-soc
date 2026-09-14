# SOC Command Center on Cumin

A full **Security Operations Center (SOC)** platform deployed on [Cumin](https://cumin.dev) — a cloud platform for deploying containerized applications via MCP (Model Context Protocol).

## Architecture

```
┌─────────────────────────────────────────────────┐
│                    Internet                      │
│                       │                          │
│            ┌──────────▼──────────┐               │
│            │   soc-gateway       │               │
│            │   (Dashboard UI)    │               │
│            │   Port 3000         │               │
│            └──────────┬──────────┘               │
│                       │ /proxy/*                 │
│            ┌──────────▼──────────┐               │
│            │   soc-backend       │               │
│            │   (All 9 Services)  │               │
│            │   Port 4000         │               │
│            │                     │               │
│            │  ┌─── SIEM ───┐     │               │
│            │  ├─── SOAR ───┤     │               │
│            │  ├── Honeypot ─┤    │               │
│            │  ├── IDS/IPS ──┤    │               │
│            │  ├── Firewall ─┤    │               │
│            │  ├──── UBA ────┤    │               │
│            │  ├─ Threat Intel┤   │               │
│            │  ├─ Vuln Scan ──┤   │               │
│            │  └── Incidents ─┘   │               │
│            └─────────────────────┘               │
│                   Cumin Cloud                    │
└─────────────────────────────────────────────────┘
```

## Services

| Service | Role | Description |
|---------|------|-------------|
| **SIEM** | Log Collection | Collects and correlates security events from multiple sources |
| **SOAR** | Orchestration | Automates security responses via playbooks |
| **Honeypot** | Deception | Deploys traps to detect and track attackers |
| **IDS/IPS** | Detection | Identifies and blocks intrusion attempts |
| **Firewall** | Traffic Control | Manages network traffic rules and blocks threats |
| **UBA** | Behavior Analytics | Detects anomalous user behavior patterns |
| **Threat Intel** | IOC Feeds | Aggregates threat intelligence from multiple sources |
| **Vuln Scanner** | Assessment | **Real-time** scanning of actual websites for security headers |
| **Incidents** | Management | Tracks and manages security incidents end-to-end |

## Real Target Monitoring

The Vulnerability Scanner performs **actual HTTP security header checks** against real websites:
- Google, GitHub, Cloudflare (external targets)
- Self-monitoring of the SOC backend

It checks for: `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`

## Project Structure

```
cumin/
├── src/
│   ├── backend.js       # Combined backend (9 services + real scanning)
│   └── gateway.js       # Dashboard UI server
├── scripts/
│   ├── deploy.js        # Deploy both apps to Cumin
│   └── cleanup.js       # Delete all apps from project
├── .gitignore
└── README.md
```

## Deployment

### Prerequisites
- Node.js 18+
- A Cumin account with API token

### Deploy
```bash
node scripts/deploy.js
```

### Cleanup
```bash
node scripts/cleanup.js
```

## Tech Stack

- **Runtime**: Node.js 22 (Alpine)
- **Platform**: Cumin Cloud (cumin.dev)
- **Protocol**: MCP (Model Context Protocol)
- **Frontend**: Vanilla HTML/CSS/JS with Inter font
- **Design**: Dark theme, glassmorphism cards

## Configuration

| Variable | Value | Description |
|----------|-------|-------------|
| `PROJECT_ID` | `178bfad9-...` | Cumin project identifier |
| `CUMIN_TOKEN` | `cumin_...` | API authentication token |
| Backend CPU | 250m | Backend resource allocation |
| Backend RAM | 512MB | Backend memory limit |
| Gateway CPU | 150m | Gateway resource allocation |
| Gateway RAM | 250MB | Gateway memory limit |

## License

MIT
