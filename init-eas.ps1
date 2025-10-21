$process = Start-Process -FilePath "npx" -ArgumentList "eas", "init" -NoNewWindow -PassThru -RedirectStandardInput "input.txt"
$process.WaitForExit()