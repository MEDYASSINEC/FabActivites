# installer.ps1
# Ce script configure un environnement portable isolé pour PHP, Node.js et Composer.

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$localDir = Join-Path $PSScriptRoot ".local_env"
if (-not (Test-Path $localDir)) {
    New-Item -ItemType Directory -Path $localDir | Out-Null
}

function Download-FileWithProgress ($url, $destinationPath) {
    try {
        $request = [System.Net.HttpWebRequest]::Create($url)
        $request.Method = "GET"
        $request.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        $response = $request.GetResponse()
        $totalBytes = $response.ContentLength
        
        $responseStream = $response.GetResponseStream()
        $targetStream = [System.IO.File]::Create($destinationPath)
        
        $buffer = New-Object Byte[] 102400 # 100 KB buffer
        $bytesRead = 0
        $totalBytesRead = 0
        
        $progressWidth = 40
        
        while (($bytesRead = $responseStream.Read($buffer, 0, $buffer.Length)) -gt 0) {
            $targetStream.Write($buffer, 0, $bytesRead)
            $totalBytesRead += $bytesRead
            
            if ($totalBytes -gt 0) {
                $percent = ($totalBytesRead / $totalBytes) * 100
                $completed = [int](($totalBytesRead / $totalBytes) * $progressWidth)
                $remaining = $progressWidth - $completed
                
                $progressBar = "[" + ("#" * $completed) + ("." * $remaining) + "]"
                $megabytesRead = [Math]::Round($totalBytesRead / 1MB, 1)
                $totalMegabytes = [Math]::Round($totalBytes / 1MB, 1)
                
                $progressText = "`r[Téléchargement] {0} {1:N0}% ({2}/{3} MB)   " -f $progressBar, $percent, $megabytesRead, $totalMegabytes
                Write-Host -NoNewline $progressText
            }
        }
        
        $targetStream.Close()
        $responseStream.Close()
        $response.Close()

        if ($totalBytes -gt 0 -and $totalBytesRead -lt $totalBytes) {
            throw "Téléchargement interrompu ou incomplet ($totalBytesRead / $totalBytes octets)."
        }

        Write-Host "`nTéléchargement terminé !`n" -ForegroundColor Green
    }
    catch {
        if ($targetStream) { $targetStream.Close() }
        if ($responseStream) { $responseStream.Close() }
        throw $_
    }
}

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "  FabActivités (CMC Tanger) - Environnement portable  " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# 1. Téléchargement et extraction de PHP
$phpDir = Join-Path $localDir "php"
if (-not (Test-Path $phpDir)) {
    Write-Host "Téléchargement de PHP portable..." -ForegroundColor Yellow
    $phpUrl = "https://windows.php.net/downloads/releases/archives/php-8.2.12-nts-Win32-vs16-x64.zip"
    $phpZip = Join-Path $localDir "php.zip"
    
    Download-FileWithProgress -url $phpUrl -destinationPath $phpZip
    
    Write-Host "Extraction de PHP..." -ForegroundColor Yellow
    Expand-Archive -Path $phpZip -DestinationPath $phpDir -Force
    Remove-Item $phpZip -Force
    
    # Configuration de php.ini
    Write-Host "Configuration de php.ini..." -ForegroundColor Yellow
    $iniDevelopment = Join-Path $phpDir "php.ini-development"
    $iniFile = Join-Path $phpDir "php.ini"
    Copy-Item $iniDevelopment $iniFile
    
    # Activation des extensions dans php.ini
    $iniContent = Get-Content $iniFile
    $iniContent = $iniContent -replace ';extension_dir = "ext"', 'extension_dir = "ext"'
    $iniContent = $iniContent -replace ';extension=curl', 'extension=curl'
    $iniContent = $iniContent -replace ';extension=fileinfo', 'extension=fileinfo'
    $iniContent = $iniContent -replace ';extension=gd', 'extension=gd'
    $iniContent = $iniContent -replace ';extension=mbstring', 'extension=mbstring'
    $iniContent = $iniContent -replace ';extension=openssl', 'extension=openssl'
    $iniContent = $iniContent -replace ';extension=pdo_mysql', 'extension=pdo_mysql'
    $iniContent = $iniContent -replace ';extension=pdo_sqlite', 'extension=pdo_sqlite'
    $iniContent = $iniContent -replace ';extension=sqlite3', 'extension=sqlite3'
    $iniContent = $iniContent -replace ';extension=zip', 'extension=zip'
    $iniContent = $iniContent -replace 'memory_limit = 128M', 'memory_limit = 512M'
    
    Set-Content -Path $iniFile -Value $iniContent
} else {
    Write-Host "PHP est déjà configuré localement." -ForegroundColor Green
}

# 2. Téléchargement et extraction de Node.js
$nodeRoot = Join-Path $localDir "node_temp"
$nodeDest = Join-Path $localDir "node"
if (-not (Test-Path $nodeDest)) {
    Write-Host "Téléchargement de Node.js portable..." -ForegroundColor Yellow
    $nodeUrl = "https://nodejs.org/dist/v22.16.0/node-v22.16.0-win-x64.zip"
    $nodeZip = Join-Path $localDir "node.zip"
    
    Download-FileWithProgress -url $nodeUrl -destinationPath $nodeZip
    
    Write-Host "Extraction de Node.js..." -ForegroundColor Yellow
    Expand-Archive -Path $nodeZip -DestinationPath $nodeRoot -Force
    
    $extractedFolder = Get-ChildItem -Path $nodeRoot -Directory | Select-Object -First 1
    Move-Item -Path $extractedFolder.FullName -Destination $nodeDest
    Remove-Item $nodeRoot -Recurse -Force
    Remove-Item $nodeZip -Force
} else {
    Write-Host "Node.js est déjà configuré localement." -ForegroundColor Green
}

# 3. Téléchargement de Composer
$composerPath = Join-Path $localDir "composer.phar"
if (-not (Test-Path $composerPath)) {
    Write-Host "Téléchargement de Composer..." -ForegroundColor Yellow
    $composerUrl = "https://getcomposer.org/composer.phar"
    Download-FileWithProgress -url $composerUrl -destinationPath $composerPath
} else {
    Write-Host "Composer est déjà présent localement." -ForegroundColor Green
}

# Injection des executables locaux dans le PATH de la session actuelle
$env:Path = "$phpDir;$nodeDest;" + $env:Path

Write-Host "`nVérification de l'environnement :" -ForegroundColor Cyan
php -v | Select-Object -First 1
node -v | Select-Object -First 1

# 4. Configuration du Backend
Write-Host "`nConfiguration du Backend..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "backend"

# Création du fichier .env
$backendEnv = Join-Path $backendPath ".env"
$backendEnvExample = Join-Path $backendPath ".env.example"
if (-not (Test-Path $backendEnv)) {
    Copy-Item $backendEnvExample $backendEnv
}

# Création du fichier database.sqlite
$dbFile = Join-Path $backendPath "database\database.sqlite"
if (-not (Test-Path $dbFile)) {
    New-Item -ItemType File -Path $dbFile -Force | Out-Null
}

# Installation des dépendances Composer
Write-Host "Installation des dépendances Laravel (Composer)..." -ForegroundColor Yellow
Set-Location $backendPath
php "$composerPath" install --no-dev --optimize-autoloader

# Initialisation de la clé d'application et de la base de données
Write-Host "Génération de la clé de chiffrement..." -ForegroundColor Yellow
php artisan key:generate --force

Write-Host "Migration et initialisation des données..." -ForegroundColor Yellow
php artisan migrate:fresh --seed --force

# 5. Configuration du Frontend
Write-Host "`nConfiguration du Frontend..." -ForegroundColor Yellow
$frontendPath = Join-Path $PSScriptRoot "frontend"

$frontendEnv = Join-Path $frontendPath ".env"
if (-not (Test-Path $frontendEnv)) {
    Set-Content -Path $frontendEnv -Value "VITE_API_URL=http://localhost:8000/api"
}

# Installation des paquets npm et compilation production
Set-Location $frontendPath
Write-Host "Installation des dépendances React (npm)..." -ForegroundColor Yellow
npm install
Write-Host "Compilation du Frontend (Vite Build)..." -ForegroundColor Yellow
npm run build

# Création du raccourci sur le Bureau
Write-Host "`nCréation du raccourci sur le Bureau..." -ForegroundColor Yellow
try {
    $WScriptShell = New-Object -ComObject WScript.Shell
    $DesktopPath = [System.Environment]::GetFolderPath("Desktop")
    $shortcutPath = Join-Path $DesktopPath "FabActivites.lnk"
    $targetPath = Join-Path $PSScriptRoot "demarrer.bat"
    
    $Shortcut = $WScriptShell.CreateShortcut($shortcutPath)
    $Shortcut.TargetPath = $targetPath
    $Shortcut.WorkingDirectory = $PSScriptRoot
    $Shortcut.IconLocation = "shell32.dll,14" # Icône de disque/dossier
    $Shortcut.Save()
    Write-Host "Raccourci 'FabActivites' créé sur le Bureau !" -ForegroundColor Green
} catch {
    Write-Warning "Création du raccourci échouée."
}

Write-Host "`n=========================================================" -ForegroundColor Green
Write-Host "  INSTALLATION RÉUSSIE !" -ForegroundColor Green
Write-Host "  Pour lancer l'application, double-cliquez sur 'demarrer.bat'" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green
