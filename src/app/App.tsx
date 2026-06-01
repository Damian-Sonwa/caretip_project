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

export default function App() {
  const AppTree = () => {
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
  };

  const tree = (
    <ThemeProvider>
      <AppTree />
    </ThemeProvider>
  );

  if (googleClientId) {
    return <GoogleOAuthProvider clientId={googleClientId}>{tree}</GoogleOAuthProvider>;
  }
  return tree;
}