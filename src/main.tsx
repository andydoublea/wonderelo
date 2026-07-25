
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import "./styles/wonderelo-utilities.css";
  import "./styles/button-hover.css";
  import "./styles/wonderelo-brand.css";
  import "./styles/wonderelo-event-page.css";
  import "./styles/wonderelo-continue-reg.css";
  import "./styles/wonderelo-confirm-email.css";
  import "./styles/wonderelo-participant-dashboard.css";
  import "./styles/wonderelo-matching.css";
  import "./styles/wonderelo-account.css";
  // Patches sonner's toast.* methods — must run before the first toast fires
  import "./utils/toastOverrides";
  import { initToastOverrides } from "./utils/toastOverridesInit";

  initToastOverrides();

  createRoot(document.getElementById("root")!).render(<App />);
  