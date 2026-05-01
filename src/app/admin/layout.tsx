import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { DevSimulationPanel } from "@/components/dev/DevSimulationPanel";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#111827]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-6xl animate-slide-up">
            {children}
          </div>
        </main>
        <DevSimulationPanel />
      </div>
    </div>
  );
}
