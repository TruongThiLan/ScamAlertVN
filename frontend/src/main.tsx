
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  // NOTE VAN DAP:
  // main.tsx la diem React mount vao div#root trong index.html.
  // Tu day App -> AuthProvider -> Router -> tung page.
  createRoot(document.getElementById("root")!).render(<App />);
