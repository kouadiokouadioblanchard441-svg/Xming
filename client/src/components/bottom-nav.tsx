import { useLocation } from "wouter";

/* ─── Icônes SVG sur mesure ─────────────────────────────── */
function IconHome({ active }: { active: boolean }) {
  const c = active ? "#fff" : "rgba(255,255,255,0.55)";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 11.5L12 3l9 8.5V21a1 1 0 01-1 1H15v-5h-6v5H4a1 1 0 01-1-1V11.5z"
        stroke={c} strokeWidth={active ? 2 : 1.6} strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

function IconProduct({ active }: { active: boolean }) {
  const c = active ? "#fff" : "rgba(255,255,255,0.55)";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="8" height="8" rx="1.5" stroke={c} strokeWidth={active ? 2 : 1.6}/>
      <rect x="13" y="3" width="8" height="8" rx="1.5" stroke={c} strokeWidth={active ? 2 : 1.6}/>
      <rect x="3" y="13" width="8" height="8" rx="1.5" stroke={c} strokeWidth={active ? 2 : 1.6}/>
      <rect x="13" y="13" width="8" height="8" rx="1.5" stroke={c} strokeWidth={active ? 2 : 1.6}/>
    </svg>
  );
}

function IconTasks({ active }: { active: boolean }) {
  const c = active ? "#fff" : "rgba(255,255,255,0.55)";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="2" width="16" height="20" rx="2" stroke={c} strokeWidth={active ? 2 : 1.6}/>
      <path d="M8 7h8M8 11h8M8 15h5" stroke={c} strokeWidth={active ? 2 : 1.6} strokeLinecap="round"/>
      <circle cx="6.5" cy="7" r="0.8" fill={c}/>
      <circle cx="6.5" cy="11" r="0.8" fill={c}/>
      <circle cx="6.5" cy="15" r="0.8" fill={c}/>
    </svg>
  );
}

function IconTeam({ active }: { active: boolean }) {
  const c = active ? "#fff" : "rgba(255,255,255,0.55)";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="7" r="3" stroke={c} strokeWidth={active ? 2 : 1.6}/>
      <path d="M3 20c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke={c} strokeWidth={active ? 2 : 1.6} strokeLinecap="round"/>
      <circle cx="18" cy="8" r="2.2" stroke={c} strokeWidth={active ? 1.8 : 1.4}/>
      <path d="M16 20c0-2.4 1.4-3.8 3.5-3.8" stroke={c} strokeWidth={active ? 1.8 : 1.4} strokeLinecap="round"/>
    </svg>
  );
}

function IconFace({ active }: { active: boolean }) {
  const c = active ? "#fff" : "rgba(255,255,255,0.55)";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={c} strokeWidth={active ? 2 : 1.6}/>
      <path d="M4 20c0-4 3.582-6 8-6s8 2 8 6" stroke={c} strokeWidth={active ? 2 : 1.6} strokeLinecap="round"/>
    </svg>
  );
}

/* ─── Barre de navigation ───────────────────────────────── */
const NAV_ITEMS = [
  { path: "/",         label: "Home",    testId: "home",     Icon: IconHome    },
  { path: "/invest",   label: "Product", testId: "products", Icon: IconProduct },
  { path: "/tasks",    label: "Tasks",   testId: "tasks",    Icon: IconTasks   },
  { path: "/team",     label: "Team",    testId: "team",     Icon: IconTeam    },
  { path: "/account",  label: "Face",    testId: "me",       Icon: IconFace    },
];

export default function BottomNav() {
  const [location, navigate] = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ background: "#E8192C" }}
    >
      <div className="flex items-center justify-around h-16 pb-1">
        {NAV_ITEMS.map(({ path, label, testId, Icon }) => {
          const isActive = location === path;
          return (
            <button
              key={path}
              onClick={() => {
                navigate(path);
                if (path === "/") window.dispatchEvent(new Event("home-tab-clicked"));
              }}
              className="flex flex-col items-center justify-center flex-1 h-full active:opacity-70 transition-opacity"
              data-testid={`nav-${testId}`}
            >
              <Icon active={isActive} />
              <span
                className="text-[10px] font-bold mt-0.5"
                style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.55)" }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
