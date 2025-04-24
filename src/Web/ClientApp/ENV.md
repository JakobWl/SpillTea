# Environment Configuration for FadeChat

This document explains how environment variables are configured in the FadeChat app.

## Environment Files

The app uses different environment files for different scenarios:

- `.env` - Default environment variables (development)
- `.env.production` - Production environment

## Available Environment Variables

- `API_URL` - The base URL for API calls
- `SIGNALR_URL` - The URL for SignalR hub connections
- `ENV` - The current environment (development, production, etc.)

## Implementation Details

The app uses a hybrid approach to environment variables:

1. **Expo Config Approach** (Primary): 
   - Environment variables are loaded via `app.config.js` into Expo Constants
   - Allows for dynamic configuration during builds

2. **react-native-dotenv Approach** (Fallback):
   - Directly imports variables from `.env` files using babel plugin
   - Provides compatibility with non-Expo projects

3. **Hardcoded Defaults** (Last Resort):
   - If all else fails, falls back to hardcoded defaults

This layered approach ensures maximum compatibility across different build systems.

## Using Different Environments

### Development

During development, the app will use development values:

```bash
# Start with default development env
npm start

# Or specify env variables inline
API_URL=https://localhost:5001 npm start
```

### Production Build

For production builds:

```bash
# Use production environment variables
npx expo build:android --profile production
npx expo build:ios --profile production
npx expo build:web --profile production

# Or specify via app.json
expo build:web --config app.config.prod.js
```

## Using Configuration in Code

Access configuration values through the config object, which handles all the environment variable logic:

```typescript
import config from '../config';

// Use the API URL
fetch(config.apiUrl + '/endpoint');

// Use the SignalR URL
const connection = new HubConnectionBuilder()
  .withUrl(config.signalRUrl)
  .build();

// Check environment
if (config.isDevelopment()) {
  console.log('Running in development mode');
}
```