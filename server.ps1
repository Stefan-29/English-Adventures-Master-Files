$port = 8001
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:' + $port + '/')

try {
    $listener.Start()
    Write-Host "================================" -ForegroundColor Green
    Write-Host "Server running at http://localhost:$port" -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor Green
    Write-Host ""
    
    while ($true) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $path = $request.Url.LocalPath
        if ($path -eq '/' -or $path -eq '') { $path = '/index.html' }
        
        $filePath = Join-Path (Get-Location).Path ($path.TrimStart('/'))
        
        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            
            $mimeTypes = @{
                '.html' = 'text/html'
                '.js' = 'application/javascript'
                '.css' = 'text/css'
                '.json' = 'application/json'
                '.jpg' = 'image/jpeg'
                '.jpeg' = 'image/jpeg'
                '.png' = 'image/png'
                '.gif' = 'image/gif'
                '.wav' = 'audio/wav'
                '.mp3' = 'audio/mpeg'
                '.ico' = 'image/x-icon'
            }
            
            $contentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { 'application/octet-stream' }
            
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.StatusCode = 200
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 200 $($request.HttpMethod) $($request.Url.LocalPath)" -ForegroundColor Green
        } else {
            $errorMsg = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
            $response.StatusCode = 404
            $response.ContentType = 'text/plain'
            $response.OutputStream.Write($errorMsg, 0, $errorMsg.Length)
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 404 $($request.HttpMethod) $($request.Url.LocalPath)" -ForegroundColor Red
        }
        
        $response.OutputStream.Close()
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    if ($listener) {
        $listener.Stop()
        $listener.Close()
    }
    Write-Host "Server stopped." -ForegroundColor Yellow
}
