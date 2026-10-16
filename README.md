# EurekaSportFitenessFrontend

## Backend connection and API contracts

Public reads and authenticated actions use same-origin Next.js handlers and the
server-only `EUREKA_API_URL` (including `/api/v1`). Development defaults to
`http://localhost:8000/api/v1`. Production and deploy previews require an explicit
HTTPS value; the production Netlify configuration specifies Railway. Copy
`.env.example` for local development. The old `EUREKA_AUTH_API_URL` and
`EUREKA_COURSES_API_URL` variables are compatible aliases, and all configured
values must match. `NEXT_PUBLIC_API_URL` is retired.

Portal responses are checked against `src/lib/api/portal-contracts.json`, generated
from backend response models. When handing off backend changes, export its schema
with `python -m scripts.export_openapi --output <openapi-path> --portal-output <frontend-path>/src/lib/api/portal-contracts.json`.
Use `--check` with the same paths to detect stale artifacts. Backend tests also
compare its tracked `contracts/openapi.json` with the current application schema.
The local historical `api.json` is an ignored reference copy; it is refreshed
during this handoff, while the generated portal contract is tracked.

The frontend owns pages, cookies, API forwarding and local drafts. Database access,
permissions, record ownership, grading and approval belong to the backend.

## Start on Windows

Requires Node.js 20.9 or newer and the project's dependencies already installed.

Run `run.ps1` from PowerShell, regardless of your current folder:

```powershell
& 'C:\Users\Anurag\Downloads\Project\Library@Intern\eurekasportfitenessfrontend\run.ps1'
```

You can also copy `run.ps1` to Desktop and choose **Run with PowerShell**. The
copied script uses the original checkout on this computer. Keep that checkout
in place, and replace the Desktop copy whenever `run.ps1` is updated. If the
checkout moves, pass its new location explicitly:

```powershell
.\run.ps1 -ProjectPath 'D:\Projects\Eureka' -Port 3001
```

Without `-Port`, Next.js chooses its normal development port and prints the Local
URL. Keep the terminal open while using the app; press **Ctrl+C** to stop.

For a Desktop shortcut, use this target; its **Start in** field can be empty:

```text
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Anurag\Downloads\Project\Library@Intern\eurekasportfitenessfrontend\run.ps1"
```

The shortcut's execution policy applies only to that PowerShell process. The
launcher runs the existing `npm run dev`, restores the caller's folder when it
exits, and reports missing prerequisites or server failures without installing
dependencies or changing system settings.
