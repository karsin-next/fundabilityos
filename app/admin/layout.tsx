/**
 * Admin layout — no sidebar, no Navbar, no footer.
 * Standalone panel protected by CRON_SECRET at the page level.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      {children}
    </div>
  );
}
