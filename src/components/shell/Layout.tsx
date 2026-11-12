import { Outlet, useLocation } from "react-router-dom";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { PresenterGuide } from "./PresenterGuide";

/** App shell: fixed top bar + 240px sidebar, content up to 1280px. */
export function AppLayout() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-bg">
      <TopBar />
      <Sidebar />
      <main key={pathname} className="anim-fade ml-[240px] pt-14">
        <div className="mx-auto max-w-[1280px] px-6 py-8">
          <Outlet />
        </div>
      </main>
      <PresenterGuide />
    </div>
  );
}

/** Full-page qualification flow: top bar only, no sidebar. */
export function FlowLayout() {
  return (
    <div className="min-h-screen bg-bg-subtle">
      <TopBar />
      <main className="pt-14"><Outlet /></main>
      <PresenterGuide />
    </div>
  );
}
