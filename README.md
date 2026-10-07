# EurekaSportFitenessFrontend

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
