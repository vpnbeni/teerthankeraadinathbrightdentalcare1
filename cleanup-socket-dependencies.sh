#!/bin/bash

# Socket.IO Dependency Cleanup Script
# Run this script to remove all socket.io packages from node_modules

echo "🧹 Cleaning up Socket.IO dependencies..."
echo ""

# Server
echo "📦 Cleaning server dependencies..."
cd server
npm uninstall socket.io
npm install
echo "✅ Server dependencies cleaned"
echo ""

# Client
echo "📦 Cleaning client dependencies..."
cd ../client
npm uninstall socket.io-client
npm install
echo "✅ Client dependencies cleaned"
echo ""

# Admin
echo "📦 Cleaning admin dependencies..."
cd ../admin
npm uninstall socket.io-client
npm install
echo "✅ Admin dependencies cleaned"
echo ""

# Root (if needed)
echo "📦 Cleaning root dependencies..."
cd ..
npm install
echo "✅ Root dependencies cleaned"
echo ""

echo "🎉 All Socket.IO dependencies removed successfully!"
echo ""
echo "Next steps:"
echo "1. Test the server: cd server && npm run dev"
echo "2. Test the client: cd client && npm run dev"
echo "3. Test the admin: cd admin && npm run dev"
echo ""
echo "Verify notifications work by:"
echo "- Booking an appointment"
echo "- Switching to another tab"
echo "- Switching back to see the notification"
