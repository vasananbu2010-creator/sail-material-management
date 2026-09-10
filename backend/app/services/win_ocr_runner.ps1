[CmdletBinding()]
param(
    [string]$ImagePath,
    [string]$ImageListFile
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | ? { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' }

function AwaitOperation($asyncOp, $type) {
    $method = $asTaskGeneric.MakeGenericMethod($type)
    $netTask = $method.Invoke($null, @($asyncOp))
    $netTask.Wait(-1) | Out-Null
    return $netTask.Result
}

[Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null

$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
if (-not $engine) {
    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new("en-US"))
}

function Process-SingleImage($path) {
    if (-not (Test-Path $path)) { return "" }
    try {
        $file = AwaitOperation ([Windows.Storage.StorageFile]::GetFileFromPathAsync($path)) ([Windows.Storage.StorageFile])
        $stream = AwaitOperation ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
        $decoder = AwaitOperation ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
        $bitmap = AwaitOperation ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
        $result = AwaitOperation ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
        $stream.Dispose()
        if ($result -and $result.Text) { return $result.Text }
        return ""
    } catch {
        return ""
    }
}

if ($ImageListFile -and (Test-Path $ImageListFile)) {
    $lines = Get-Content $ImageListFile
    $idx = 0
    foreach ($line in $lines) {
        $trimmed = $line.Trim()
        if ($trimmed) {
            Write-Output "---PAGE_START:$idx---"
            $txt = Process-SingleImage $trimmed
            if ($txt) { Write-Output $txt }
            Write-Output "---PAGE_END:$idx---"
            $idx++
        }
    }
} elseif ($ImagePath) {
    $txt = Process-SingleImage $ImagePath
    if ($txt) { Write-Output $txt }
}
