const { spawn } = require('child_process');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting SpillTea Development Environment with ngrok...');

// Check if .NET API is running on port 5000
function checkApiRunning() {
  return new Promise((resolve) => {
    exec('netstat -an | findstr ":5000"', (error, stdout) => {
      if (error || !stdout.trim()) {
        console.log('❌ .NET API is not running on port 5000!');
        console.log('Please start your .NET API first, then run this script again.');
        process.exit(1);
      }
      console.log('✅ .NET API is running on port 5000');
      resolve();
    });
  });
}

// Start ngrok and get the URL
function startNgrok() {
  return new Promise((resolve) => {
    console.log('🌐 Starting ngrok...');
    console.log('💡 For consistent URLs, consider upgrading to ngrok with a static domain');
    
    // Use ngrok with static domain if available, otherwise use random
    const ngrok = spawn('ngrok', ['http', '5000'], {
      stdio: 'pipe',
      shell: true
    });

    ngrok.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('Ngrok:', output.trim());
      
      // Look for the forwarding URL
      const match = output.match(/Forwarding\s+(https:\/\/[^\s]+)\s+->\s+http:\/\/localhost:5000/);
      if (match) {
        const url = match[1];
        console.log(`✅ Ngrok ready at: ${url}`);
        console.log('');
        console.log('🔧 OAuth Provider Setup Required:');
        console.log('Add these URLs to your OAuth provider settings:');
        console.log(`Google: ${url}/api/Users/google/login/callback`);
        console.log(`Facebook: ${url}/api/Users/facebook/login/callback`);
        console.log('');
        
        // Store ngrok process for cleanup
        global.ngrokProcess = ngrok;
        
        // Wait a bit more for tunnel to be fully ready
        setTimeout(() => resolve(url), 2000);
      }
    });

    ngrok.stderr.on('data', (data) => {
      console.log('Ngrok error:', data.toString());
    });
  });
}

// Start Expo with the tunnel URL as API_URL environment variable
function startExpo(tunnelUrl) {
  console.log('📱 Starting Expo for Android...');
  console.log('Press "a" when Expo starts to open in Android emulator');
  console.log('Press Ctrl+C to stop everything');
  
  // Set the tunnel URL as API_URL environment variable
  const env = { ...process.env, API_URL: tunnelUrl };
  
  const expo = spawn('npx', ['expo', 'start', '--android'], {
    stdio: 'inherit',
    shell: true,
    env: env
  });

  // Store expo process for cleanup
  global.expoProcess = expo;

  expo.on('close', (code) => {
    console.log(`Expo process exited with code ${code}`);
    cleanup();
  });
}

// Cleanup function
function cleanup() {
  if (global.ngrokProcess) {
    global.ngrokProcess.kill();
    console.log('Ngrok stopped');
  }
  if (global.expoProcess) {
    global.expoProcess.kill();
    console.log('Expo stopped');
  }
  process.exit(0);
}

// Handle process termination
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Main execution
async function main() {
  try {
    await checkApiRunning();
    const tunnelUrl = await startNgrok();
    startExpo(tunnelUrl);
  } catch (error) {
    console.error('Error:', error);
    cleanup();
  }
}

main(); 