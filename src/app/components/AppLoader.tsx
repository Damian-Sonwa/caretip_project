import { PageLoader } from "./PageLoader";

export function AppLoader({ message }: { message?: string }) {
  return <PageLoader message={message} />;
}

