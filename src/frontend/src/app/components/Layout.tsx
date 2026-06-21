import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useMemo } from "react";

export function Layout() {
  const backend = useMemo(() => HTML5Backend, []);

  return (
    <DndProvider backend={backend}>
      <div className="flex h-screen bg-[#f0f4f8] overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto" id="main-scroll">
          <Outlet />
        </main>
      </div>
    </DndProvider>
  );
}