# SpillTea

SpillTea is a real-time chat application that allows users to connect with random people around the world. Built with ASP.NET Core 9 and React Native (Expo), it provides a modern, mobile-first chat experience with strong authentication.

## Features

- **Real-time chat** using SignalR
- **OAuth/OIDC Authentication** with support for Google and Facebook providers
- **React Native with Expo** for cross-platform mobile support
- **TypeScript** for type-safe code
- **Clean Architecture** for maintainable and testable code

## Backend Technology Stack

- ASP.NET Core 9
- Entity Framework Core 9
- SignalR for real-time communication
- ASP.NET Core Identity for authentication
- OpenID Connect and OAuth 2.0 for external authentication

## Frontend Technology Stack

- React Native with Expo
- TypeScript
- React Navigation for routing
- React Native Paper for UI components
- Expo Auth Session for OAuth integration
- SignalR client for real-time communication

## Getting Started

### Prerequisites

- .NET 9 SDK
- Node.js and npm
- Expo CLI

### Running the Backend

```bash
cd ./src/Web/
dotnet run
```

The API will be available at https://localhost:5001.

### Running the Frontend (Expo App)

```bash
cd ./src/Web/ClientApp/
npm install
npm start
```

Follow the Expo CLI instructions to run the app on your preferred platform.

## Development

### Project Structure

- `/src/Application/` - Application business logic and interfaces
- `/src/Domain/` - Domain entities and business rules
- `/src/Infrastructure/` - Implementation of interfaces defined in the Application layer
- `/src/Web/` - ASP.NET Core web API and SignalR hub
- `/src/Web/ClientApp/` - React Native Expo application

### Authentication Configuration

External authentication providers need to be configured in `appsettings.json`:

```json
"Authentication": {
  "OIDC": {
    "Authority": "https://your-identity-provider.com",
    "ClientId": "your-client-id",
    "ClientSecret": "your-client-secret"
  },
  "Google": {
    "ClientId": "your-google-client-id",
    "ClientSecret": "your-google-client-secret"
  },
  "Facebook": {
    "AppId": "your-facebook-app-id",
    "AppSecret": "your-facebook-app-secret"
  }
}
```

## Testing

The solution contains unit, integration, and functional tests.

```bash
dotnet test
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

The project was built on the foundation of [Clean.Architecture.Solution.Template](https://github.com/jasontaylordev/CleanArchitecture) version 9.0.8.