import { RouterProvider } from 'react-router';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'sonner';
import { router } from './routes';
import { TipFlowProvider } from './context/TipFlowContext';
import { AppLoadingSplashProvider } from './context/AppLoadingSplashContext';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? '';

export default function App() {
  const tree = (
    <TipFlowProvider>
      <AppLoadingSplashProvider>
        <RouterProvider router={router} />
        <Toaster theme="light" position="top-center" closeButton />
        <PwaInstallPrompt />
      </AppLoadingSplashProvider>
    </TipFlowProvider>
  );

  if (googleClientId) {
    return <GoogleOAuthProvider clientId={googleClientId}>{tree}</GoogleOAuthProvider>;
  }
  return tree;
}