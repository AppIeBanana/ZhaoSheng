# Git 中文提交辅助脚本
# 用法: .\git-commit-zh.ps1 "你的中文提交信息"

param(
    [Parameter(Mandatory=$true)]
    [string]$Message
)

# 设置控制台编码为 UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$env:LESSCHARSET = 'utf-8'

# 创建临时文件存储提交信息
$tempFile = [System.IO.Path]::GetTempFileName()
[System.IO.File]::WriteAllText($tempFile, $Message, [System.Text.Encoding]::UTF8)

try {
    # 使用文件方式提交
    git commit -F $tempFile
    Write-Host "提交成功！" -ForegroundColor Green
}
finally {
    # 清理临时文件
    if (Test-Path $tempFile) {
        Remove-Item $tempFile
    }
}


