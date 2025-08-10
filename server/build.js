#!/usr/bin/env node

/**
 * Build script for Vercel deployment
 * This script prepares the server for serverless deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting build process for Vercel deployment...');

// Check if required files exist
const requiredFiles = [
    'package.json',
    'vercel.json',
    'api/index.js',
    'src/config/environment.js',
    'src/config/database.js'
];

console.log('📋 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} - Found`);
    } else {
        console.log(`❌ ${file} - Missing`);
        allFilesExist = false;
    }
});

if (!allFilesExist) {
    console.log('❌ Build failed: Missing required files');
    process.exit(1);
}

// Check package.json for required dependencies
console.log('📦 Checking dependencies...');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

const requiredDeps = [
    'express',
    'mongoose',
    'cors',
    'dotenv',
    'jsonwebtoken',
    'bcryptjs'
];

const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);

if (missingDeps.length > 0) {
    console.log('❌ Missing required dependencies:', missingDeps);
    process.exit(1);
}

console.log('✅ All required dependencies found');

// Validate environment variables template
console.log('🔧 Checking environment configuration...');

const envExample = `
# Required Environment Variables for Vercel Deployment
NODE_ENV=production
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret-key
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
ENCRYPTION_KEY=your-256-bit-encryption-key
`;

// Create .env.example if it doesn't exist
const envExamplePath = path.join(__dirname, '.env.example');
if (!fs.existsSync(envExamplePath)) {
    fs.writeFileSync(envExamplePath, envExample.trim());
    console.log('✅ Created .env.example file');
}

console.log('✅ Build process completed successfully!');
console.log('');
console.log('📋 Next steps for Vercel deployment:');
console.log('1. Push your code to GitHub');
console.log('2. Connect your GitHub repo to Vercel');
console.log('3. Set Root Directory to "server" in Vercel project settings');
console.log('4. Add environment variables in Vercel dashboard');
console.log('5. Deploy!');
console.log('');
console.log('🔗 Test URLs after deployment:');
console.log('- https://your-app.vercel.app/ (Health check)');
console.log('- https://your-app.vercel.app/api (API health check)');
console.log('- https://your-app.vercel.app/api/test (Environment test)');