export default function MonitorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#111827] text-white">
      {children}
    </div>
  );
}
