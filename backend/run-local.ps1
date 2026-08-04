$ErrorActionPreference = "Stop"

$envFile = Join-Path $PSScriptRoot ".env"

if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()

        if ($line.Length -eq 0 -or $line.StartsWith("#")) {
            return
        }

        $parts = $line.Split("=", 2)

        if ($parts.Count -eq 2) {
            $name = $parts[0].Trim()
            $value = $parts[1].Trim().Trim('"').Trim("'")
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

$required = @(
    "DB_URL",
    "DB_USERNAME",
    "DB_PASSWORD",
    "JWT_SECRET"
)

$missing = $required | Where-Object {
    [string]::IsNullOrWhiteSpace(
        [Environment]::GetEnvironmentVariable($_, "Process")
    )
}

if ($missing.Count -gt 0) {
    Write-Error "Missing required backend environment variables: $($missing -join ', '). Create backend\.env from backend\.env.example and fill in your Supabase/JWT values."
    exit 1
}

$jwtSecret = [Environment]::GetEnvironmentVariable("JWT_SECRET", "Process")

if ($jwtSecret -eq "PASTE_GENERATED_BASE64_SECRET_HERE") {
    Write-Error "JWT_SECRET still contains the placeholder value. Generate a real base64 secret and update backend\.env."
    exit 1
}

try {
    $jwtSecretBytes = [Convert]::FromBase64String($jwtSecret)
}
catch {
    Write-Error "JWT_SECRET must be a valid base64 string."
    exit 1
}

if ($jwtSecretBytes.Length -lt 32) {
    Write-Error "JWT_SECRET must decode to at least 32 bytes."
    exit 1
}

$dbUrl = [Environment]::GetEnvironmentVariable("DB_URL", "Process")
$dbUsername = [Environment]::GetEnvironmentVariable("DB_USERNAME", "Process")
$dbPassword = [Environment]::GetEnvironmentVariable("DB_PASSWORD", "Process")

if (!$dbUrl.StartsWith("jdbc:postgresql://")) {
    Write-Error "DB_URL must be a PostgreSQL JDBC URL starting with jdbc:postgresql://."
    exit 1
}

if ($dbUrl -match "YOUR_|PASTE_|your_supabase_host") {
    Write-Error "DB_URL still contains a placeholder. Replace it with the real Supabase PostgreSQL JDBC URL."
    exit 1
}

if ($dbUsername -match "YOUR_|PASTE_") {
    Write-Error "DB_USERNAME still contains a placeholder. Replace it with the real Supabase database username."
    exit 1
}

if ($dbPassword -match "YOUR_|PASTE_") {
    Write-Error "DB_PASSWORD still contains a placeholder. Replace it with the real Supabase database password."
    exit 1
}

Push-Location $PSScriptRoot

try {
    .\mvnw.cmd spring-boot:run
}
finally {
    Pop-Location
}
