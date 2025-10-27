@echo off
REM Socket.IO Dependency Cleanup Script for Windows
REM Run this script to remove all socket.io packages from node_modules

echo 🧹 Cleaning up Socket.IO dependencies...
echo.

REM Server
echo 📦 Cleaning server dependencies...
cd server
call npm uninstall socket.io
call npm install
echo ✅ Server dependencies cleaned
echo.

REM Client
echo 📦 Cleaning client dependencies...
cd ..\client
call npm uninstall socket.io-client
call npm install
echo ✅ Client dependencies cleaned
echo.

REM Admin
echo 📦 Cleaning admin dependencies...
cd ..\admin
call npm uninstall socket.io-client
call npm install
echo ✅ Admin dependencies cleaned
echo.

REM Root (if needed)
echo 📦 Cleaning root dependencies...
cd ..
call npm install
echo ✅ Root dependencies cleaned
echo.

echo 🎉 All Socket.IO dependencies removed successfully!
echo.
echo Next steps:
echo 1. Test the server: cd server ^&^& npm run dev
echo 2. Test the client: cd client ^&^& npm run dev
echo 3. Test the admin: cd admin ^&^& npm run dev
echo.
echo Verify notifications work by:
echo - Booking an appointment
echo - Switching to another tab
echo - Switching back to see the notification

pause
