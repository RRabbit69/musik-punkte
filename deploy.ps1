# Veröffentlicht den aktuellen Stand auf GitHub Pages.
# Aufruf aus dem MusikPunkte-Ordner:  powershell -File deploy.ps1
$ErrorActionPreference = 'Stop'
$repo = $PSScriptRoot
$dist = Join-Path $repo 'dist'

Set-Location $repo
npx expo export --platform web
if ($LASTEXITCODE -ne 0) { throw 'Export fehlgeschlagen' }

Copy-Item (Join-Path $dist 'index.html') (Join-Path $dist '404.html') -Force
New-Item -ItemType File (Join-Path $dist '.nojekyll') -Force | Out-Null

# dist ist nach jedem Export frisch (ohne .git) -> temporäres Repo anlegen
git -C $dist init -b gh-pages
git -C $dist config user.name 'Joerg'
git -C $dist config user.email 'gordil69@gmail.com'
git -C $dist add -A
git -C $dist commit -m 'Deploy'
git -C $dist push -f https://github.com/RRabbit69/musik-punkte.git gh-pages
Remove-Item -Recurse -Force (Join-Path $dist '.git')
Write-Host 'Fertig: https://rrabbit69.github.io/musik-punkte/'
