$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8081/")
$listener.Start()
Write-Host "Listening on http://localhost:8081/"

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $requestUrl = $context.Request.Url.LocalPath
        if ($requestUrl -eq "/") { $requestUrl = "/index.html" }
        
        # Prevent directory traversal
        $requestUrl = $requestUrl.Replace("..", "")
        
        $filePath = Join-Path (Get-Location).Path $requestUrl
        
        if (Test-Path $filePath -PathType Leaf) {
            $buffer = [System.IO.File]::ReadAllBytes($filePath)
            $context.Response.ContentLength64 = $buffer.Length
            
            if ($requestUrl.EndsWith(".html")) { $context.Response.ContentType = "text/html" }
            elseif ($requestUrl.EndsWith(".css")) { $context.Response.ContentType = "text/css" }
            elseif ($requestUrl.EndsWith(".js")) { $context.Response.ContentType = "application/javascript" }
            elseif ($requestUrl.EndsWith(".json")) { $context.Response.ContentType = "application/json" }
            
            try {
                $context.Response.OutputStream.Write($buffer, 0, $buffer.Length)
            } catch {
                # Ignore disconnects
            }
        } else {
            $context.Response.StatusCode = 404
        }
        try {
            $context.Response.OutputStream.Close()
        } catch {}
    }
} catch {
    Write-Host "Server encountered an error: $($_.Exception.Message)"
} finally {
    $listener.Stop()
}
