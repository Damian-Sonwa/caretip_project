import { CareTipPageLoader } from "./CareTipPageLoader";

export function AppLoader({ message = "Setting things up for you..." }: { message?: string }) {
  return <CareTipPageLoader variant="wait" message={message} />;
}

