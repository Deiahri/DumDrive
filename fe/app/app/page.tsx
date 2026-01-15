import { AppProvider } from "./_context/AppContext";
import AppController from "./controller";

export default function Page() {
  return (
    // <AppProvider>
      <AppController />
    // </AppProvider>
  );
}
