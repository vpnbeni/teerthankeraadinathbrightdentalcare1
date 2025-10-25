import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This script requires sharp package for image processing
// Run: npm install --save-dev sharp

async function generateIcons() {
    try {

        const inputPath = path.join(__dirname, 'public', 'tabdc_logo.webp');
        const outputDir = path.join(__dirname, 'public');

        // Check if input file exists
        if (!fs.existsSync(inputPath)) {
            console.error('❌ Error: tabdc_logo.webp not found in public directory');
            process.exit(1);
        }

        console.log('🎨 Generating PWA icons from tabdc_logo.webp...\n');

        // Icon sizes to generate
        const icons = [
            { name: 'pwa-64x64.png', size: 64 },
            { name: 'pwa-192x192.png', size: 192 },
            { name: 'pwa-512x512.png', size: 512 },
            { name: 'apple-touch-icon.png', size: 180 },
            { name: 'favicon.ico', size: 32 }
        ];

        // Generate standard icons
        for (const icon of icons) {
            const outputPath = path.join(outputDir, icon.name);

            await sharp(inputPath)
                .resize(icon.size, icon.size, {
                    fit: 'contain',
                    background: { r: 255, g: 255, b: 255, alpha: 1 }
                })
                .png()
                .toFile(outputPath);

            console.log(`✅ Generated: ${icon.name} (${icon.size}x${icon.size})`);
        }

        // Generate maskable icon with padding (safe zone)
        const maskableSize = 512;
        const padding = Math.floor(maskableSize * 0.1); // 10% padding for safe zone
        const logoSize = maskableSize - (padding * 2);

        await sharp(inputPath)
            .resize(logoSize, logoSize, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 0 }
            })
            .extend({
                top: padding,
                bottom: padding,
                left: padding,
                right: padding,
                background: { r: 52, g: 104, b: 112, alpha: 1 } // #346870 primary color
            })
            .png()
            .toFile(path.join(outputDir, 'maskable-icon-512x512.png'));

        console.log(`✅ Generated: maskable-icon-512x512.png (512x512 with safe zone)`);

        console.log('\n🎉 All PWA icons generated successfully!');
        console.log('\n📁 Icons saved to: client/public/');
        console.log('\n✨ Your PWA is ready to use!');

    } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
            console.error('\n❌ Error: sharp package not found');
            console.error('\n📦 Please install sharp:');
            console.error('   npm install --save-dev sharp\n');
            console.error('Then run this script again:');
            console.error('   node generate-icons.js\n');
        } else {
            console.error('❌ Error generating icons:', error.message);
        }
        process.exit(1);
    }
}

generateIcons();
