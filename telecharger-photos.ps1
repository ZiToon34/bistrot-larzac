# ============================================================================
# Le Bistrot Larzac - télécharge les photos et logos du site d'origine (RestoPro)
# dans le dossier site\images, avec des noms simples.
# A lancer depuis la racine du dossier BistroLarzac :
#   powershell -ExecutionPolicy Bypass -File .\telecharger-photos.ps1
# ============================================================================

$ErrorActionPreference = "Stop"
$base = "https://www.le-bistrot-larzac-restaurant-la-vacquerie.fr/websites/056567220fe5ed6d29d76493c71f70d1/img/"
$dossier = Join-Path $PSScriptRoot "site\images"
New-Item -ItemType Directory -Force -Path $dossier | Out-Null

# Nom dans notre site  =>  nom sur le site d'origine
$photos = [ordered]@{
  "salle.jpg"               = "accueilsalle_20250530114012.jpg"
  "viande.jpg"              = "accueilviande_20250530114015.jpg"
  "pates.jpg"               = "accueilpates_20250530114022.jpg"
  "terrasse.jpg"            = "accueilterrasse_20250530114042.jpg"
  "plat-a.jpg"              = "platA_20250530160508.jpg"
  "plat-b.jpg"              = "platB_20250530160515.jpg"
  "plat-d.jpg"              = "platD_20250530160513.jpg"
  "plat-e.jpg"              = "platE_20250530160859.jpg"
  "cuisine-feu-de-bois.jpg" = "restocuisinefeudebois_20250530115301.jpg"
  "vins.jpg"                = "restlovins_20250530115306.jpg"
  "plat-1.jpg"              = "restoplat1_20250530115939.jpg"
  "plat-2.jpg"              = "restoplat2_20250530115934.jpg"
  "plat-3.jpg"              = "restoplat3_20250530115932.jpg"
  "plat-4.jpg"              = "restoplat4_20250530115936.jpg"
  "traiteur.jpg"            = "restotraiteur_20250530115313.jpg"
  "tarte-fraise.jpg"        = "restotartefraise_20250530115315.jpg"
  "entete-pages.jpg"        = "headerpages_20250530161521.jpg"
  "cuir.jpg"                = "background.jpg"
  "logo-blanc.png"          = "le-bistrot-larzac-restaurant-la-vacquerie-et-saint-martin-de-castries-214942-20250530150541-6839ad2571eed.png"
  "separateur.png"          = "le-bistrot-larzac-restaurant-la-vacquerie-et-saint-martin-de-castries-215011-20250530152952-6839b2d02a485.png"
  "logo-terracotta.png"     = "adresse-horaires-telephone-le-bistrot-larzac-restaurant-la-vacquerie-et-saint-martin-de-castries-215028-20250530163602-6839c252bacbb.png"
  "repere.png"              = "adresse-horaires-telephone-le-bistrot-larzac-restaurant-la-vacquerie-et-saint-martin-de-castries-215028-20250530162728-6839c050f3a49.png"
  "logo-menu.png"           = "logo-menu.png"
  "logo-footer.png"         = "logo-footer.png"
  "favicon.png"             = "favicon.png"
}

$ok = 0
foreach ($photo in $photos.GetEnumerator()) {
  $cible = Join-Path $dossier $photo.Key
  try {
    Invoke-WebRequest -Uri ($base + $photo.Value) -OutFile $cible -UseBasicParsing
    Write-Host "OK      $($photo.Key)"
    $ok++
  } catch {
    Write-Host "ERREUR  $($photo.Key) : $($_.Exception.Message)" -ForegroundColor Red
  }
}
Write-Host ""
Write-Host "$ok / $($photos.Count) fichiers telecharges dans $dossier"
