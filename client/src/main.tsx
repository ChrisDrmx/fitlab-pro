import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./index.css";

if (!window.location.hash) {
  window.location.hash = "#/";
}

// Mise en cache de l'application pour un fonctionnement hors ligne complet.
registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(<App />);
