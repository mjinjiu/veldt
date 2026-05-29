# Veldt integration test script
param(
    [int]$Port = 8000
)

$BaseUrl = "http://localhost:$Port"
$Pass = 0
$Fail = 0

function Test-Endpoint {
    param($Name, $Method, $Path, $Body, $CheckFn)
    Write-Host -NoNewline "  $Name ... "
    try {
        $params = @{ Method = $Method; Uri = "$BaseUrl$Path" }
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Compress)
            $params.ContentType = "application/json"
        }
        $resp = Invoke-WebRequest @params -SkipHttpErrorCheck
        if ($CheckFn.Invoke($resp)) {
            Write-Host "PASS" -ForegroundColor Green
            $script:Pass++
        } else {
            Write-Host "FAIL" -ForegroundColor Red
            Write-Host "    Status: $($resp.StatusCode), Body: $($resp.Content)" -ForegroundColor Red
            $script:Fail++
        }
    } catch {
        Write-Host "FAIL" -ForegroundColor Red
        Write-Host "    Error: $_" -ForegroundColor Red
        $script:Fail++
    }
}

Write-Host "=== Veldt Integration Tests ===" -ForegroundColor Cyan
Write-Host ""

# Health check
Write-Host "[Health]"
Test-Endpoint "GET /health" "GET" "/health" $null { param($r) $r.StatusCode -eq 200 -and ($r.Content | ConvertFrom-Json).status -eq "ok" }

# Ingest markdown
Write-Host "[Ingest]"
$mdContent = "# Test Document`n`nVeldt is a privacy-first document Q&A tool.`n`n## Features`n`n- Local embeddings`n- BYOK architecture`n- Zero telemetry"
$tempFile = New-TemporaryFile
$mdFile = "$tempFile.md"
Rename-Item $tempFile $mdFile
Set-Content $mdFile $mdContent -Encoding UTF8

$form = @{ file = Get-Item $mdFile }
$ingestResp = Invoke-WebRequest -Uri "$BaseUrl/ingest" -Method POST -Form $form -SkipHttpErrorCheck
if ($ingestResp.StatusCode -eq 200) {
    $ingestData = $ingestResp.Content | ConvertFrom-Json
    Write-Host "  POST /ingest (md) ... PASS (doc_id=$($ingestData.doc_id), chunks=$($ingestData.chunks))" -ForegroundColor Green
    $Pass++
    $DocId = $ingestData.doc_id
} else {
    Write-Host "  POST /ingest (md) ... FAIL ($($ingestResp.StatusCode))" -ForegroundColor Red
    $Fail++
}

# Search
Write-Host "[Search]"
$searchBody = @{ query = "What is Veldt?" }
$searchResp = Invoke-WebRequest -Uri "$BaseUrl/search" -Method POST -Body ($searchBody | ConvertTo-Json -Compress) -ContentType "application/json" -SkipHttpErrorCheck
if ($searchResp.StatusCode -eq 200) {
    $searchData = $searchResp.Content | ConvertFrom-Json
    if ($searchData.results.Count -gt 0) {
        Write-Host "  POST /search ... PASS ($($searchData.results.Count) results)" -ForegroundColor Green
        $Pass++
    } else {
        Write-Host "  POST /search ... FAIL (0 results)" -ForegroundColor Red
        $Fail++
    }
} else {
    Write-Host "  POST /search ... FAIL ($($searchResp.StatusCode))" -ForegroundColor Red
    $Fail++
}

# Empty query error
Write-Host "[Edge Cases]"
Test-Endpoint "Empty query returns 400" "POST" "/search" @{ query = "" } { param($r) $r.StatusCode -eq 400 }

# Cleanup
Remove-Item $mdFile -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== Results: $Pass passed, $Fail failed ===" -ForegroundColor $(if ($Fail -eq 0) { "Green" } else { "Red" })

exit $Fail
