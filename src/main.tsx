
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import "./styles/visual-styles.css";
  import "./styles/button-hover.css";
  // Patches sonner's toast.* methods — must run before the first toast fires
  import "./utils/toastOverrides";
  import { initToastOverrides } from "./utils/toastOverridesInit";

  initToastOverrides();

  createRoot(document.getElementById("root")!).render(<App />);
  