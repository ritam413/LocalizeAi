# LOCALIZE Backend
Autonomous AI Post-Production Crew for Film/Video Localization backend engine and agents.

## Quick Start Commands

### From Workspace Root (`LocalizeAi`)
```powershell
$env:PYTHONPATH="backend"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### From `backend/` Directory
```powershell
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

> **Note on Host Binding**:
> - Use `--host 0.0.0.0` to allow access from other devices on your LAN (e.g. `http://192.168.x.x:8000`).
> - Use `--host 127.0.0.1` for local-only loopback access.
