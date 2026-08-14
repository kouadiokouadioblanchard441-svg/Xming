import { useLocation } from "wouter";
import { Home, Grid2x2, Star, User } from "lucide-react";

const ACCENT = "#E8192C";

const navItems = [
  { path: "/",        label: "Accueil",     icon: Home,     testId: "home"     },
  { path: "/invest",  label: "Séjours",     icon: Grid2x2,  testId: "products" },
  { path: "/team",    label: "Équipe",      icon: Star,     testId: "team"     },
  { path: "/account", label: "Mon compte",  icon: User,     testId: "me"       },
];

export default function BottomNav() {
  const [location, navigate] = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ background: "#111111", borderTop: "1px solid #222" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", height: 64, paddingBottom: 4 }}>
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                if (item.path === "/") {
                  window.dispatchEvent(new Event("home-tab-clicked"));
                }
              }}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                background: "none",
                border: "none",
                cursor: "pointer",
                gap: 3,
              }}
              data-testid={`nav-${item.testId}`}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.2 : 1.6}
                color={isActive ? ACCENT : "rgba(255,255,255,0.45)"}
                style={{ transition: "color 0.15s" }}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? ACCENT : "rgba(255,255,255,0.45)",
                  transition: "color 0.15s",
                  letterSpacing: "0.01em",
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
