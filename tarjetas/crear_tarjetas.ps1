# Crea las etiquetas, los sprints (milestones), las tarjetas (issues) y el tablero de GitHub Projects
# a partir de tarjetas.json.
#
# Requisitos (una sola vez):
#   1. GitHub CLI instalado y con sesion iniciada:   gh auth login
#   2. Permiso para Projects:                        gh auth refresh -s project
#   3. El repositorio ya existe en GitHub.
#
# Uso:   powershell -ExecutionPolicy Bypass -File .\crear_tarjetas.ps1 -Owner joeljorex -Repo cosecha-helada-portafolio

param(
    [string]$Owner = 'joeljorex',
    [string]$Repo = 'cosecha-helada-portafolio'
)

$full = "$Owner/$Repo"
$datos = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot 'tarjetas.json') | ConvertFrom-Json

function Revisar($paso) {
    if ($LASTEXITCODE -ne 0) { throw "Fallo: $paso" }
}

Write-Host "1/4 Etiquetas..."
foreach ($p in $datos.etiquetas.PSObject.Properties) {
    gh label create $p.Name --color $p.Value --repo $full --force | Out-Null
    Revisar "etiqueta $($p.Name)"
}

Write-Host "2/4 Sprints (milestones)..."
$existentes = gh api "repos/$full/milestones?state=all" --jq '.[].title'
foreach ($s in $datos.sprints) {
    if ($existentes -notcontains $s) {
        gh api "repos/$full/milestones" -f "title=$s" | Out-Null
        Revisar "milestone $s"
    }
}

Write-Host "3/4 Tablero de GitHub Projects..."
$proyecto = gh project create --owner $Owner --title $datos.proyecto --format json | ConvertFrom-Json
Revisar 'crear proyecto'
gh project link $proyecto.number --owner $Owner --repo $full | Out-Null
$campos = gh project field-list $proyecto.number --owner $Owner --format json | ConvertFrom-Json
$estado = $campos.fields | Where-Object { $_.name -eq 'Status' }
$opciones = @{
    'Por hacer'   = ($estado.options | Where-Object { $_.name -eq 'Todo' }).id
    'En progreso' = ($estado.options | Where-Object { $_.name -eq 'In Progress' }).id
    'Hecho'       = ($estado.options | Where-Object { $_.name -eq 'Done' }).id
}

Write-Host "4/4 Tarjetas..."
$n = 0
foreach ($t in $datos.tarjetas) {
    $n++
    $url = gh issue create --repo $full --title $t.titulo --body $t.descripcion --label $t.etiqueta --milestone $t.sprint
    Revisar "issue $($t.titulo)"
    $item = gh project item-add $proyecto.number --owner $Owner --url $url --format json | ConvertFrom-Json
    gh project item-edit --id $item.id --project-id $proyecto.id --field-id $estado.id --single-select-option-id $opciones[$t.estado] | Out-Null
    if ($t.estado -eq 'Hecho') { gh issue close $url --reason completed | Out-Null }
    Write-Host ("  [{0}/{1}] {2} -> {3}" -f $n, $datos.tarjetas.Count, $t.titulo, $t.estado)
}

Write-Host ""
Write-Host "Listo. Tablero: $($proyecto.url)"
