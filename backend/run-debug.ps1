# Set the output file path
$logFile = "$PSScriptRoot\debug-output-full.log"

# Clear any existing log file
if (Test-Path $logFile) {
    Remove-Item $logFile -Force
}

# Function to write to both console and log file
function Write-Log {
    param([string]$message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss.fff"
    $logMessage = "[$timestamp] $message"
    Write-Host $logMessage
    Add-Content -Path $logFile -Value $logMessage
}

Write-Log "Starting debug script with full output capture..."

# Run the debug script and capture all output
$process = Start-Process -FilePath "node" -ArgumentList "scripts/debug-survey-request.js" -NoNewWindow -PassThru -RedirectStandardOutput "$PSScriptRoot\stdout.log" -RedirectStandardError "$PSScriptRoot\stderr.log" -WorkingDirectory $PSScriptRoot

# Wait for the process to complete
$process | Wait-Process

# Log the exit code
Write-Log "Process exited with code $($process.ExitCode)"

# Output the log files
Write-Log "`n=== Standard Output ==="
Get-Content "$PSScriptRoot\stdout.log" | ForEach-Object { Write-Log $_ }

Write-Log "`n=== Standard Error ==="
Get-Content "$PSScriptRoot\stderr.log" | ForEach-Object { Write-Log $_ }

# Clean up temporary files
Remove-Item "$PSScriptRoot\stdout.log" -Force -ErrorAction SilentlyContinue
Remove-Item "$PSScriptRoot\stderr.log" -Force -ErrorAction SilentlyContinue

Write-Log "`nDebug capture complete. Full log saved to: $logFile"
