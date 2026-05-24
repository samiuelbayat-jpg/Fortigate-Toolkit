@echo off
cd /d "%~dp0"
echo Starting NetWolf Zabbix demo API...
echo.
echo URL for NetWolf Monitoring: http://127.0.0.1:5052
echo Token: demo-token
echo.
echo Keep this window open while testing.
echo.
node zabbix-demo-server.js
pause
