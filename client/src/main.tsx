import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// The app is a hash-based SPA (see App.tsx's useHashPath), so client-side
// routing only ever looks at window.location.hash. If a user opens a real
// URL path directly — e.g. a shared link to "/register" or "/register?invite_code=..."
// without a "#" — the hash is empty, the router falls back to "/", and an
// unauthenticated visitor gets redirected to the login page instead of the
// page they actually asked for. Normalize any such direct-path visit into
// the equivalent hash route before the app renders.
(function normalizeDirectPathVisit() {
  const { pathname, search, hash } = window.location;
  if (!hash && pathname && pathname !== "/") {
    window.history.replaceState(null, "", "/#" + pathname + search);
  }
})();

document.addEventListener("contextmenu", (e) => {
  if ((e.target as HTMLElement).tagName === "IMG") {
    e.preventDefault();
  }
});

document.addEventListener("dragstart", (e) => {
  if ((e.target as HTMLElement).tagName === "IMG") {
    e.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
