# Mobile Prototype Setup

This folder contains the React Native prototype for the **Chronos Maps Mobile App**.

## Prerequisites
- **Node.js** & **npm/yarn**
- **Expo CLI**: `npm install -g expo-cli`

## Setup Instructions

1.  **Initialize a new Expo project**:
    ```bash
    npx create-expo-app chronos-mobile --template blank-typescript
    cd chronos-mobile
    ```

2.  **Install Dependencies**:
    ```bash
    npx expo install react-native-maps expo-location expo-blur @expo/vector-icons
    ```

3.  **Copy Component**:
    - Copy `ChronosMapScreen.tsx` from this folder into your `chronos-mobile/` project (e.g., in a `screens/` folder).

4.  **Edit `App.tsx`**:
    Import and render the component:
    ```tsx
    import ChronosMapScreen from './screens/ChronosMapScreen';

    export default function App() {
      return <ChronosMapScreen />;
    }
    ```

5.  **Run**:
    ```bash
    npx expo start
    ```
    - Scan the QR code with **Expo Go** on your Android/iOS device.

## Key Features Implemented
- **Google Maps SDK**: Uses `react-native-maps` with `PROVIDER_GOOGLE`.
- **Dark Mode**: Custom JSON style injected into the map.
- **Glassmorphism**: `BlurView` from `expo-blur` creates the frosted glass header.
- **3D Camera**: `animateCamera` allows smooth transitions between pitch 0 (2D) and pitch 65 (3D).
