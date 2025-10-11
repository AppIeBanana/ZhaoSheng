# 解决PowerShell执行策略限制问题

## 问题描述
当您尝试运行 `npm run dev` 或 `pnpm run dev` 命令时，遇到了以下错误：

```
无法加载文件 D:\environment\node\npm.ps1，因为在此系统上禁止运行脚本。
有关详细信息，请参阅 https:/go.microsoft.com/fwlink/?LinkID=135170 中的 about_Execution_Policies。
```

这是因为Windows系统的PowerShell默认设置了严格的执行策略，阻止了运行脚本文件。

## 解决方案

### 方法1：使用已创建的直接启动脚本（推荐临时使用）

我已经为您创建了一个特殊的批处理文件 `start-direct.bat`，它可以直接运行vite命令，绕过PowerShell执行策略限制：

1. 打开**文件资源管理器**
2. 导航到 `D:\mywork\project\zhaosheng_forked\ZhaoSheng` 目录
3. 双击运行 `start-direct.bat` 文件
4. 服务器将在端口3303上启动

### 方法2：永久解决PowerShell执行策略问题

如果您希望永久解决这个问题，可以按照以下步骤修改PowerShell执行策略：

1. **以管理员身份运行PowerShell**
   - 点击Windows开始菜单
   - 搜索 "PowerShell"
   - 右键点击 "Windows PowerShell"
   - 选择 "以管理员身份运行"

2. **查看当前执行策略**
   ```powershell
   Get-ExecutionPolicy -List
   ```

3. **设置执行策略为RemoteSigned**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
   - 这将允许运行本地创建的脚本，同时要求从互联网下载的脚本必须签名

4. **确认更改**
   当系统提示时，输入 `Y` 并按回车确认

5. **验证更改**
   ```powershell
   Get-ExecutionPolicy
   ```
   应该显示 `RemoteSigned`

### 方法3：使用命令提示符(CMD)而不是PowerShell

1. 打开**命令提示符**（按Win+R，输入`cmd`并按回车）
2. 导航到项目目录：
   ```cmd
   cd D:\mywork\project\zhaosheng_forked\ZhaoSheng
   ```
3. 运行启动命令：
   ```cmd
   npm run dev
   ```
   或
   ```cmd
   pnpm run dev
   ```

## 其他说明

- 如果您在运行过程中遇到其他问题，请检查：
  1. 是否已经安装了Node.js（推荐版本16.x或以上）
  2. 是否已经安装了项目依赖（运行过 `npm install` 或 `pnpm install`）
  3. 端口3303是否被其他程序占用

- 成功启动后，可以在浏览器中访问 http://localhost:3303 查看项目

如果以上方法仍无法解决问题，请联系技术支持获取进一步帮助。