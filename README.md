# Maternal & Child Health Management System - Client

A comprehensive client application for the Maternal and Child Health Management System, featuring both mobile and web applications.

## Project Structure

```
client/
├── mobile-app/    # React Native (Expo) mobile application
└── web-app/       # Next.js web application
```

## Mobile App

The mobile application is built with **React Native** and **Expo**, providing a cross-platform solution for iOS and Android.

### Features
- 🏠 Home dashboard with child health summary
- 👶 Child profile management
- 💉 Immunization tracking (Sri Lanka National Schedule)
- 📈 Growth monitoring and charts
- 🍼 Feeding guidelines
- 📅 Appointment scheduling
- 🌐 Multi-language support (English, Sinhala, Tamil)
- 📴 Offline-first architecture

### Tech Stack
- React Native with Expo SDK 54
- TypeScript
- Zustand for state management
- React Navigation
- i18next for internationalization
- react-native-svg for charts

### Getting Started

```bash
cd mobile-app
npm install
npx expo start
```

## Web App

The web application is built with **Next.js** for administrative and healthcare provider access.

### Getting Started

```bash
cd web-app
npm install
npm run dev
```

## Environment Setup

1. Install Node.js (v18 or later)
2. Install dependencies in each sub-project
3. For mobile development, install Expo Go on your device

## License

MIT License
