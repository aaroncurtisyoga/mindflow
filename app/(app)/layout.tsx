import { getCategories } from "@/lib/actions/category.actions";
import { getTodayCount, getViewCounts } from "@/lib/actions/todo.actions";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [categories, todayCount, viewCounts] = await Promise.all([
    getCategories(),
    getTodayCount(),
    getViewCounts(),
  ]);

  return (
    <AppShell categories={categories} todayCount={todayCount} viewCounts={viewCounts}>
      {children}
    </AppShell>
  );
}
