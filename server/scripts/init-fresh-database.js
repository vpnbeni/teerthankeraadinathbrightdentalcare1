#!/usr/bin/env node
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverRoot = join(__dirname, '..');

console.log('🚀 Initializing Fresh Database...\n');

const steps = [
  {
    name: '1️⃣  Creating Admin User',
    command: 'node scripts/createAdmin.js',
  },
  {
    name: '2️⃣  Seeding Dental Plans',
    command: 'npm run seed-plans',
  },
  {
    name: '3️⃣  Seeding Availability Templates',
    command: 'npm run seed-availability',
  },
  {
    name: '4️⃣  Fixing Database Indexes',
    command: 'node scripts/check-and-fix-indexes.js',
  },
];

async function runStep(step) {
  console.log(`\n${step.name}`);
  console.log('='.repeat(50));
  try {
    execSync(step.command, {
      cwd: serverRoot,
      stdio: 'inherit',
    });
    console.log(`✅ ${step.name} - COMPLETED\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${step.name} - FAILED`);
    console.error(error.message);
    return false;
  }
}

async function main() {
  console.log('📋 This script will initialize your fresh database with:');
  console.log('   • Admin user (admin@teerthankerdentalcare.com)');
  console.log('   • 5 Dental plans (3 adult + 2 kids)');
  console.log('   • 3 Availability templates');
  console.log('   • Database indexes');
  console.log('\n⚠️  Make sure your MONGODB_URI is set correctly!\n');

  let successCount = 0;
  
  for (const step of steps) {
    const success = await runStep(step);
    if (success) successCount++;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\n🎉 Initialization Complete: ${successCount}/${steps.length} steps succeeded\n`);

  if (successCount === steps.length) {
    console.log('✅ All steps completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Login to admin panel:');
    console.log('      • Email: admin@teerthankerdentalcare.com');
    console.log('      • Password: admin123');
    console.log('   2. ⚠️  IMMEDIATELY change the admin password!');
    console.log('   3. Verify plans are visible in the client app');
    console.log('   4. Configure availability and holidays as needed\n');
  } else {
    console.log('⚠️  Some steps failed. Check the errors above.');
    console.log('   You can re-run individual steps:');
    steps.forEach((step, index) => {
      console.log(`   ${index + 1}. ${step.command}`);
    });
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

