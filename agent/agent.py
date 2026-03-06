"""
╔══════════════════════════════════════════════════════════════════════════════╗
║  CITIL Campus Inventory – Endpoint Agent                                     ║
║  Version  : 1.0.0                                                            ║
║  Purpose  : Collect system info and auto-register with the campus server.    ║
║  Install  : python agent.py  (or set up as a service – see README.md)        ║
╚══════════════════════════════════════════════════════════════════════════════╝

Dependencies (install once on target PC):
    pip install requests psutil

Collected data sent to server:
    - hostname, IP address, MAC address
    - RAM (total), CPU model
    - Operating system
    - Timestamp of first registration & each heartbeat
"""

import json
import os
import platform
import socket
import time
import uuid
import logging
import sys
from datetime import datetime

try:
    import requests
except ImportError:
    print("[ERROR] 'requests' library not found. Run: pip install requests")
    sys.exit(1)

try:
    import psutil
except ImportError:
    print("[ERROR] 'psutil' library not found. Run: pip install psutil")
    sys.exit(1)

# ── Path resolution ───────────────────────────────────────────────────────────
if getattr(sys, 'frozen', False):
    # If running as an EXE (frozen), look next to the EXE
    BASE_DIR = os.path.dirname(sys.executable)
else:
    # If running as a script, look next to agent.py
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Logging setup ─────────────────────────────────────────────────────────────
LOG_FILE = os.path.join(BASE_DIR, "agent.log")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("citil-agent")

# ── Load configuration ────────────────────────────────────────────────────────
CONFIG_FILE = os.path.join(BASE_DIR, "config.json")

def load_config():
    """Load config.json from the same directory as the program."""
    if not os.path.exists(CONFIG_FILE):
        log.error(f"config.json not found at {CONFIG_FILE}")
        sys.exit(1)
    with open(CONFIG_FILE, "r") as f:
        cfg = json.load(f)
    log.info(f"Config loaded. Server: {cfg.get('server_url')}")
    return cfg

# ── System info collection ────────────────────────────────────────────────────
def get_mac_address():
    """Get primary MAC address (formatted as XX:XX:XX:XX:XX:XX)."""
    mac_int = uuid.getnode()
    mac_hex = f"{mac_int:012x}"
    return ":".join(mac_hex[i:i+2].upper() for i in range(0, 12, 2))

def get_local_ip():
    """Get the local LAN IP address by connecting to a public address (no data sent)."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except Exception:
        return socket.gethostbyname(socket.gethostname())

def get_cpu_model():
    """Get CPU model string."""
    try:
        if platform.system() == "Windows":
            import winreg
            key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE,
                                 r"HARDWARE\DESCRIPTION\System\CentralProcessor\0")
            model, _ = winreg.QueryValueEx(key, "ProcessorNameString")
            return model.strip()
        elif platform.system() == "Linux":
            with open("/proc/cpuinfo") as f:
                for line in f:
                    if "model name" in line:
                        return line.split(":")[1].strip()
        elif platform.system() == "Darwin":
            import subprocess
            result = subprocess.run(
                ["sysctl", "-n", "machdep.cpu.brand_string"],
                capture_output=True, text=True
            )
            return result.stdout.strip()
    except Exception:
        pass
    return platform.processor() or "Unknown CPU"

def get_ram_gb():
    """Get total physical RAM in GB (rounded)."""
    try:
        ram_bytes = psutil.virtual_memory().total
        return f"{round(ram_bytes / (1024 ** 3))} GB"
    except Exception:
        return "Unknown"

def get_uptime():
    """Get system uptime string."""
    try:
        boot_time = psutil.boot_time()
        uptime_seconds = time.time() - boot_time
        days = int(uptime_seconds // (24 * 3600))
        hours = int((uptime_seconds % (24 * 3600)) // 3600)
        return f"{days}d {hours}h"
    except Exception:
        return "Unknown"

def collect_system_info():
    """Gather all system info into a dict ready for the API."""
    return {
        "hostname":    socket.gethostname(),
        "ip":          get_local_ip(),
        "mac":         get_mac_address(),
        "cpu":         get_cpu_model(),
        "ram":         get_ram_gb(),
        "os":          f"{platform.system()} {platform.release()}",
        "os_version":  platform.version(),
        "platform":    platform.machine(),
        "uptime":      get_uptime(),
        "timestamp":   datetime.now().isoformat(),
        "agent_version": "1.0.0",
    }

# ── API communication ─────────────────────────────────────────────────────────
def register(cfg, data):
    """
    POST system info to POST /api/register
    Server should return { "asset_id": "CLG-001", "status": "registered" | "updated" }
    """
    url     = cfg["server_url"].rstrip("/") + "/api/register"
    timeout = cfg.get("timeout_seconds", 10)
    headers = {"Content-Type": "application/json"}

    # Optional API key header for secured endpoints
    if cfg.get("api_key"):
        headers["X-API-Key"] = cfg["api_key"]

    try:
        resp = requests.post(url, json=data, headers=headers, timeout=timeout)
        resp.raise_for_status()
        result = resp.json()
        log.info(f"[REGISTER] Success → Asset ID: {result.get('asset_id')} | Status: {result.get('status')}")
        return result
    except requests.exceptions.ConnectionError:
        log.warning(f"[REGISTER] Cannot reach server at {url}. Will retry in {cfg.get('retry_interval_seconds', 60)}s.")
    except requests.exceptions.Timeout:
        log.warning(f"[REGISTER] Request timed out after {timeout}s.")
    except requests.exceptions.HTTPError as e:
        log.error(f"[REGISTER] HTTP {e.response.status_code}: {e.response.text}")
    except Exception as e:
        log.error(f"[REGISTER] Unexpected error: {e}")
    return None

def heartbeat(cfg, data):
    """
    POST heartbeat (same data structure) to POST /api/heartbeat
    This keeps last_seen updated without creating a new asset record.
    """
    url     = cfg["server_url"].rstrip("/") + "/api/heartbeat"
    timeout = cfg.get("timeout_seconds", 10)
    headers = {"Content-Type": "application/json"}
    if cfg.get("api_key"):
        headers["X-API-Key"] = cfg["api_key"]

    try:
        resp = requests.post(url, json=data, headers=headers, timeout=timeout)
        resp.raise_for_status()
        log.info(f"[HEARTBEAT] OK → {data['hostname']} ({data['ip']})")
    except Exception as e:
        log.warning(f"[HEARTBEAT] Failed: {e}")

# ── Main loop ─────────────────────────────────────────────────────────────────
def main():
    log.info("=" * 60)
    log.info("  CITIL Endpoint Agent starting…")
    log.info("=" * 60)

    cfg = load_config()
    heartbeat_interval = cfg.get("heartbeat_interval_seconds", 300)   # default 5 min
    retry_interval     = cfg.get("retry_interval_seconds",    60)     # retry if offline

    # ── Initial registration ──
    registered = False
    while not registered:
        info = collect_system_info()
        log.info(f"System info: {json.dumps(info, indent=2)}")
        result = register(cfg, info)
        if result:
            registered = True
        else:
            log.info(f"Retrying registration in {retry_interval}s…")
            time.sleep(retry_interval)

    # ── Heartbeat loop ──
    log.info(f"Registration complete. Sending heartbeat every {heartbeat_interval}s.")
    while True:
        time.sleep(heartbeat_interval)
        info = collect_system_info()
        heartbeat(cfg, info)

if __name__ == "__main__":
    main()
