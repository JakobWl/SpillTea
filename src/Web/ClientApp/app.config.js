const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
const env = process.env.NODE_ENV || 'development';
const envPath = path.resolve(
  __dirname,
  env === 'production' ? '.env.production' : '.env'
);

// Load the environment file
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn(`Failed to load env file from ${envPath}: ${result.error}`);
}

// Import existing config
const existingAppJson = require('./app.json');

// Build an updated config with env variables
module.exports = {
  ...existingAppJson.expo,
  extra: {
    apiUrl: process.env.API_URL || 'https://localhost:5001',
    signalrUrl: process.env.SIGNALR_URL || 'https://localhost:5001/hubs/chat',
    env: process.env.ENV || 'development',
  },
};