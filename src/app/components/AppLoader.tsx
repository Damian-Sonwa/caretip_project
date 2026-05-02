import { PageLoader } from "./PageLoader";

export function AppLoader({ message = "Setting things up for you..." }: { message?: string }) {
  return <PageLoader message={message} />;
}

