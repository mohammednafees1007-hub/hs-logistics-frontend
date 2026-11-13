param(
    [Parameter(Mandatory=$true)][string]$Sdk,
    [Parameter(Mandatory=$true)][string]$Output,
    [Parameter(Mandatory=$true)][string]$KeyStore,
    [string]$BuildTools = '36.0.0'
)
$ErrorActionPreference = 'Stop'
$Sdk = (Resolve-Path -LiteralPath $Sdk).Path
$Output = [IO.Path]::GetFullPath($Output)
$KeyStore = [IO.Path]::GetFullPath($KeyStore)
$tools = Join-Path $Sdk "build-tools/$BuildTools"
$platform = Join-Path $Sdk 'platforms/android-36/android.jar'
$scratch = Join-Path ([IO.Path]::GetTempPath()) ("hs-android-" + [Guid]::NewGuid())

function Invoke-BuildTool([string]$program, [string[]]$arguments) {
    & $program @arguments
    if ($LASTEXITCODE -ne 0) { throw "Build tool failed: $program" }
}

New-Item -ItemType Directory -Path "$scratch/res/drawable","$scratch/classes" -Force | Out-Null
try {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot '../static/hs-192.png') -Destination "$scratch/res/drawable/hs.png"
    Invoke-BuildTool "$tools/aapt2.exe" @('compile','--dir',"$scratch/res",'-o',"$scratch/resources.zip")
    Invoke-BuildTool "$tools/aapt2.exe" @('link','-I',$platform,'--manifest',"$PSScriptRoot/AndroidManifest.xml",'-o',"$scratch/unsigned.apk","$scratch/resources.zip")
    Invoke-BuildTool 'javac' @('--release','8','-classpath',$platform,'-d',"$scratch/classes","$PSScriptRoot/WorkspaceActivity.java")
    $classes = @(Get-ChildItem "$scratch/classes" -Recurse -Filter '*.class' | ForEach-Object FullName)
    Invoke-BuildTool "$tools/d8.bat" (@('--lib',$platform,'--min-api','26','--output',$scratch) + $classes)
    Push-Location $scratch
    try {
        Invoke-BuildTool 'jar' @('uf','unsigned.apk','classes.dex')
    } finally { Pop-Location }
    Invoke-BuildTool "$tools/zipalign.exe" @('-f','-p','4',"$scratch/unsigned.apk","$scratch/aligned.apk")
    if (!(Test-Path -LiteralPath $KeyStore)) {
        Invoke-BuildTool 'keytool' @('-genkeypair','-keystore',$KeyStore,'-alias','androiddebugkey','-storepass','android','-keypass','android','-dname','CN=HS Logistics Preview','-keyalg','RSA','-keysize','2048','-validity','3650')
    }
    Invoke-BuildTool "$tools/apksigner.bat" @('sign','--ks',$KeyStore,'--ks-pass','pass:android','--key-pass','pass:android','--ks-key-alias','androiddebugkey','--out',$Output,"$scratch/aligned.apk")
    Invoke-BuildTool "$tools/apksigner.bat" @('verify','--verbose',$Output)
} finally {
    $resolved = (Resolve-Path -LiteralPath $scratch).Path
    $temp = (Resolve-Path -LiteralPath ([IO.Path]::GetTempPath())).Path.TrimEnd('\','/')
    if ((Split-Path $resolved -Parent) -eq $temp -and (Split-Path $resolved -Leaf) -like 'hs-android-*') {
        Remove-Item -LiteralPath $resolved -Recurse -Force
    }
}
