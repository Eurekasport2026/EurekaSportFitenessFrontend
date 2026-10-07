<#
.SYNOPSIS
Starts the Eureka development server from any working directory.
.DESCRIPTION
Uses the checkout beside this script, or the original checkout when this file
is copied to Desktop. Pass -ProjectPath if the checkout has moved.
.EXAMPLE
& 'C:\path\to\eurekasportfitenessfrontend\run.ps1'
.EXAMPLE
.\run.ps1 -ProjectPath 'D:\Projects\Eureka' -Port 3001
#>
[CmdletBinding()]
param(
    [string]$ProjectPath,

    [ValidateRange(1, 65535)]
    [int]$Port
)

$ErrorActionPreference = 'Stop'
$launcherExitCode = 1
$locationPushed = $false
$originalProjectPath = 'C:\Users\Anurag\Downloads\Project\Library@Intern\eurekasportfitenessfrontend'

try {
    if ([string]::IsNullOrWhiteSpace($ProjectPath)) {
        foreach ($candidatePath in @($PSScriptRoot, $originalProjectPath)) {
            $candidateManifest = Join-Path -Path $candidatePath -ChildPath 'package.json'
            if (Test-Path -LiteralPath $candidateManifest -PathType Leaf) {
                try {
                    $candidatePackage = Get-Content -LiteralPath $candidateManifest -Raw | ConvertFrom-Json
                    if ($candidatePackage.name -eq 'eurekasportfitenessfrontend') {
                        $ProjectPath = $candidatePath
                        break
                    }
                }
                catch {
                    # Keep looking if a nearby package.json is unrelated or invalid.
                }
            }
        }
    }

    if ([string]::IsNullOrWhiteSpace($ProjectPath)) {
        throw 'Project not found. Run this script with -ProjectPath pointing to the Eureka checkout.'
    }

    $resolvedProjectPath = (Resolve-Path -LiteralPath $ProjectPath).ProviderPath
    $manifestPath = Join-Path -Path $resolvedProjectPath -ChildPath 'package.json'
    $projectPackage = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    if ($projectPackage.name -ne 'eurekasportfitenessfrontend' -or -not $projectPackage.scripts.dev) {
        throw 'The selected folder is not the Eureka frontend project with a dev script.'
    }

    if (-not (Get-Command node.exe -CommandType Application -ErrorAction SilentlyContinue)) {
        throw 'Node.js is missing from PATH. Install Node.js 20.9 or newer, then reopen PowerShell.'
    }
    $npmCommand = Get-Command npm.cmd -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $npmCommand) {
        throw 'npm.cmd is missing from PATH. Repair your Node.js installation, then reopen PowerShell.'
    }
    $npmExecutablePath = $npmCommand.Path
    $nextPackagePath = Join-Path -Path $resolvedProjectPath -ChildPath 'node_modules\next\package.json'
    if (-not (Test-Path -LiteralPath $nextPackagePath -PathType Leaf)) {
        throw 'Project dependencies are missing. Install them in the project folder before running this launcher.'
    }

    $npmArguments = @('run', 'dev')
    if ($PSBoundParameters.ContainsKey('Port')) {
        $npmArguments += @('--', '--port', [string]$Port)
    }

    Write-Host "Project: $resolvedProjectPath" -ForegroundColor Cyan
    Write-Host 'Starting Eureka. Use the Local URL printed below; press Ctrl+C to stop.'
    Push-Location -LiteralPath $resolvedProjectPath
    $locationPushed = $true
    & $npmExecutablePath @npmArguments
    $launcherExitCode = $LASTEXITCODE
}
catch {
    Write-Host "Unable to start Eureka: $($_.Exception.Message)" -ForegroundColor Red
}
finally {
    if ($locationPushed) {
        Pop-Location
    }
}

exit $launcherExitCode
