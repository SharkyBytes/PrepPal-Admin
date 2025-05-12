/**
 * This script checks that environment variables are correctly set up
 */
const fs = require('fs');
const path = require('path');

const envFilePath = path.join(__dirname, '../.env.local');

function checkEnvFile() {
  console.log('Checking environment variables...');
  
  // Check if .env.local exists
  if (!fs.existsSync(envFilePath)) {
    console.error('.env.local file not found! Please create it with your Supabase credentials.');
    process.exit(1);
  }
  
  // Read env file
  const envContent = fs.readFileSync(envFilePath, 'utf8');
  
  // Check for required variables
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  const missingVars = [];
  for (const varName of requiredVars) {
    if (!envContent.includes(`${varName}=`)) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please add them to your .env.local file.');
    process.exit(1);
  }
  
  console.log('✅ Environment variables look good!');
}

// Run the check
checkEnvFile(); 