import { RouterProvider } from 'react-router';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'sonner';
import { router } from './routes';
import { TipFlowProvider } from './context/TipFlowContext';
import { AppLoadingSplashProvider } from './context/AppLoadingSplashContext';
import { AppLoadingManagerProvider } from './context/AppLoadingManager';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { AuthProvider } from "./components/AuthProvider";
import { SocketProvider } from "./context/SocketProvider";
import { googleOAuthWebClientId } from "./lib/googleOAuthWebClientId";

const googleClientId = googleOAuthWebClientId();

function AppTree() {
  const { mode } = useTheme();
  return (
    <TipFlowProvider>
      <AppLoadingSplashProvider>
        <AuthProvider>
          <AppLoadingManagerProvider>
            <SocketProvider>
              <RouterProvider router={router} />
            </SocketProvider>
          </AppLoadingManagerProvider>
        </AuthProvider>
        <Toaster theme={mode} position="top-center" closeButton />
        <PwaInstallPrompt />
      </AppLoadingSplashProvider>
    </TipFlowProvider>
  );
}

function AppWithTheme() {
  return (
    <ThemeProvider>
      <AppTree />
    </ThemeProvider>
  );
}

export default function App() {
  if (googleClientId) {
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        <AppWithTheme />
      </GoogleOAuthProvider>
    );
  }
  return <AppWithTheme />;
}
