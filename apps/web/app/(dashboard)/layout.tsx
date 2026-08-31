import { Providers } from "../../components/providers";
import { Sidebar } from "../../components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="flex min-h-screen flex-col bg-neutral-50 lg:flex-row">
        <Sidebar />
        <main className="flex-1 lg:ml-64 overflow-auto">
          <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </Providers>
  );
}
