# Screenshot via DevTools protocol (headless Edge): waits for the READY title, optional -Eval JS, then Page.captureScreenshot.
param([string]$Url, [string]$Out, [int]$W = 1920, [int]$H = 1080, [int]$Wait = 60, [string]$Eval = '')
$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$prof = Join-Path $env:TEMP ('edgeprof' + [guid]::NewGuid().ToString('N').Substring(0, 8))
$port = 9333
$p = Start-Process $edge -ArgumentList "--headless=new", "--remote-debugging-port=$port", "--user-data-dir=$prof", "--window-size=$W,$H", "--no-first-run", "--disable-gpu", "about:blank" -PassThru
try {
  $tabs = $null
  for ($i = 0; $i -lt 40 -and -not $tabs; $i++) { Start-Sleep -Milliseconds 250; try { $tabs = Invoke-RestMethod "http://127.0.0.1:$port/json" } catch {} }
  $ws = ($tabs | Where-Object { $_.type -eq 'page' } | Select-Object -First 1).webSocketDebuggerUrl
  $c = [System.Net.WebSockets.ClientWebSocket]::new(); $c.Options.KeepAliveInterval = [TimeSpan]::Zero
  $c.ConnectAsync([Uri]$ws, [Threading.CancellationToken]::None).Wait()
  $script:id = 0
  function Send-Cdp($method, $params) {
    $script:id++; $myid = $script:id
    $msg = @{ id = $myid; method = $method; params = $params } | ConvertTo-Json -Depth 10 -Compress
    $b = [Text.Encoding]::UTF8.GetBytes($msg)
    $c.SendAsync([ArraySegment[byte]]::new($b), 'Text', $true, [Threading.CancellationToken]::None).Wait()
    while ($true) {
      $ms = [IO.MemoryStream]::new(); $buf = [byte[]]::new(1048576)
      do { $r = $c.ReceiveAsync([ArraySegment[byte]]::new($buf), [Threading.CancellationToken]::None).Result; $ms.Write($buf, 0, $r.Count) } while (-not $r.EndOfMessage)
      $o = [Text.Encoding]::UTF8.GetString($ms.ToArray()) | ConvertFrom-Json
      if ($o.id -eq $myid) { return $o }
    }
  }
  Send-Cdp 'Emulation.setDeviceMetricsOverride' @{ width = $W; height = $H; deviceScaleFactor = 1; mobile = $false } | Out-Null
  Send-Cdp 'Page.navigate' @{ url = $Url } | Out-Null
  $t0 = Get-Date
  while (((Get-Date) - $t0).TotalSeconds -lt $Wait) {
    Start-Sleep -Milliseconds 500
    $r = Send-Cdp 'Runtime.evaluate' @{ expression = 'document.title' }
    if ($r.result.result.value -match 'READY|ERR') { break }
  }
  Write-Host "title: $($r.result.result.value)"
  if ($Eval) { $e = Send-Cdp 'Runtime.evaluate' @{ expression = $Eval; awaitPromise = $true; returnByValue = $true }; Write-Host "eval: $($e.result.result.value)"; Start-Sleep -Milliseconds 600 }
  Start-Sleep -Milliseconds 800
  $s = Send-Cdp 'Page.captureScreenshot' @{ format = 'png' }
  [IO.File]::WriteAllBytes($Out, [Convert]::FromBase64String($s.result.data))
  Write-Host "saved $Out"
} finally { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue; Start-Sleep -Milliseconds 500; Remove-Item -Recurse -Force $prof -ErrorAction SilentlyContinue }
