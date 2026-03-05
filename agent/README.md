# CITIL Endpoint Agent

**Standalone Python agent** that auto-discovers and registers each campus PC with the CITIL Campus Inventory server.

---

## What It Does

| Step | Action |
|------|--------|
| 1 | Collects hostname, IP, MAC, CPU, RAM, OS from the local machine |
| 2 | POSTs data to `POST /api/register` on first run |
| 3 | Sends periodic **heartbeat** to `POST /api/heartbeat` (keeps *last_seen* updated) |
| 4 | Dashboard reads the database and shows the system under **New Systems** |

---

## File Structure

```
agent/
├── agent.py       ← main program (install this on each PC)
├── config.json    ← configuration (set server_url here)
├── agent.log      ← auto-created log file
└── README.md      ← this file
```

---

## Quick Start

### 1. Prerequisites

Install Python 3.8+ on the target PC, then:

```bash
pip install requests psutil
```

### 2. Configure

Edit `config.json`:

```json
{
    "server_url": "http://<YOUR-SERVER-IP>:5000",
    "api_key": "",
    "heartbeat_interval_seconds": 300,
    "timeout_seconds": 10
}
```

Replace `<YOUR-SERVER-IP>` with the actual server address (LAN IP or domain).

### 3. Run

```bash
python agent.py
```

---

## Run as a Background Service

### Windows — Task Scheduler

```powershell
schtasks /create /tn "CITIL-Agent" /tr "python C:\citil-agent\agent.py" /sc onstart /ru SYSTEM /f
```

Or use **NSSM** (Non-Sucking Service Manager):

```powershell
nssm install CITIL-Agent "python" "C:\citil-agent\agent.py"
nssm start CITIL-Agent
```

### Linux — systemd

Create `/etc/systemd/system/citil-agent.service`:

```ini
[Unit]
Description=CITIL Endpoint Agent
After=network.target

[Service]
ExecStart=/usr/bin/python3 /opt/citil-agent/agent.py
WorkingDirectory=/opt/citil-agent
Restart=always
RestartSec=30
User=root

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable citil-agent
sudo systemctl start citil-agent
sudo systemctl status citil-agent
```

---

## Data Sent to Server

```json
{
    "hostname":      "LAB1-PC-01",
    "ip":            "192.168.10.45",
    "mac":           "A4:BB:CC:DD:12:89",
    "cpu":           "Intel Core i5-10400",
    "ram":           "8 GB",
    "os":            "Windows 11 22H2",
    "os_version":    "10.0.22621",
    "platform":      "AMD64",
    "timestamp":     "2024-01-23T08:44:00.000Z",
    "agent_version": "1.0.0"
}
```

---

## Server API Expected Endpoints

| Method | Endpoint | Response |
|--------|----------|----------|
| POST | `/api/register` | `{ "asset_id": "CLG-001", "status": "registered" }` |
| POST | `/api/heartbeat` | `{ "status": "ok" }` |

---

## Logs

The agent writes to `agent.log` in the same directory:

```
2024-01-23 08:44:00 [INFO] CITIL Endpoint Agent starting…
2024-01-23 08:44:01 [INFO] System info: { ... }
2024-01-23 08:44:01 [INFO] [REGISTER] Success → Asset ID: CLG-001 | Status: registered
2024-01-23 08:49:01 [INFO] [HEARTBEAT] OK → LAB1-PC-01 (192.168.10.45)
```
