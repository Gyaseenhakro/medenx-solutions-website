param(
    [string]$RootDir = $PSScriptRoot
)

$utf8 = [System.Text.Encoding]::UTF8
$headerTemplate = [System.IO.File]::ReadAllText((Join-Path $RootDir "partials\header.html"), $utf8)
$footerTemplate = [System.IO.File]::ReadAllText((Join-Path $RootDir "partials\footer.html"), $utf8)

$pages = @(
    @{ Path = "index.html";                                        Prefix = "";    Active = "Home" }
    @{ Path = "about.html";                                        Prefix = "";    Active = "About" }
    @{ Path = "services.html";                                     Prefix = "";    Active = "Services" }
    @{ Path = "insights.html";                                     Prefix = "";    Active = "Insights" }
    @{ Path = "contact.html";                                      Prefix = "";    Active = "Contact" }
    @{ Path = "case-studies.html";                                 Prefix = "";    Active = $null }
    @{ Path = "privacy.html";                                      Prefix = "";    Active = $null }
    @{ Path = "terms.html";                                        Prefix = "";    Active = $null }
    @{ Path = "disclaimer.html";                                   Prefix = "";    Active = $null }
    @{ Path = "accessibility.html";                                Prefix = "";    Active = $null }
    @{ Path = "404.html";                                          Prefix = "";    Active = $null }
    @{ Path = "insights\prior-authorization-bottlenecks.html";     Prefix = "../"; Active = "Insights" }
)

$navKeys = @("Home", "About", "Services", "Insights", "Contact")

function Render-Partial {
    param([string]$Template, [string]$Prefix, [string]$Active)

    $out = $Template -replace [regex]::Escape("{{PREFIX}}"), $Prefix
    foreach ($key in $navKeys) {
        $token = "{{ACTIVE_$($key.ToUpper())}}"
        $value = ""
        if ($Active -eq $key) { $value = ' class="active"' }
        $out = $out -replace [regex]::Escape($token), $value
    }
    return $out
}

$markers = @{
    Header = @{
        Marked = '(?s)<!-- BUILD:HEADER -->.*?<!-- /BUILD:HEADER -->'
        Raw    = '(?s)<header class="site-header">.*?</header>'
    }
    Footer = @{
        Marked = '(?s)<!-- BUILD:FOOTER -->.*?<!-- /BUILD:FOOTER -->'
        Raw    = '(?s)<footer class="site-footer">.*?</footer>'
    }
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$updated = 0

foreach ($page in $pages) {
    $filePath = Join-Path $RootDir $page.Path
    if (-not (Test-Path $filePath)) {
        Write-Warning "Missing page: $($page.Path)"
        continue
    }

    $content = [System.IO.File]::ReadAllText($filePath, $utf8)

    $renderedHeader = Render-Partial -Template $headerTemplate -Prefix $page.Prefix -Active $page.Active
    $renderedFooter = Render-Partial -Template $footerTemplate -Prefix $page.Prefix -Active $page.Active

    $headerBlock = "<!-- BUILD:HEADER -->`r`n$renderedHeader`r`n<!-- /BUILD:HEADER -->"
    $footerBlock = "<!-- BUILD:FOOTER -->`r`n$renderedFooter`r`n<!-- /BUILD:FOOTER -->"
    $headerBlockEscaped = $headerBlock -replace '\$', '$$$$'
    $footerBlockEscaped = $footerBlock -replace '\$', '$$$$'

    if ($content -match $markers.Header.Marked) {
        $content = $content -replace $markers.Header.Marked, $headerBlockEscaped
    } elseif ($content -match $markers.Header.Raw) {
        $content = $content -replace $markers.Header.Raw, $headerBlockEscaped
    } else {
        Write-Warning "No <header> block found in $($page.Path)"
    }

    if ($content -match $markers.Footer.Marked) {
        $content = $content -replace $markers.Footer.Marked, $footerBlockEscaped
    } elseif ($content -match $markers.Footer.Raw) {
        $content = $content -replace $markers.Footer.Raw, $footerBlockEscaped
    } else {
        Write-Warning "No <footer> block found in $($page.Path)"
    }

    [System.IO.File]::WriteAllText($filePath, $content, $utf8NoBom)
    Write-Host "Updated $($page.Path)"
    $updated++
}

Write-Host "Done. $updated page(s) updated from partials/header.html and partials/footer.html."
