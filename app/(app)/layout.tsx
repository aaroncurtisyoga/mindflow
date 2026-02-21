import { getCategories } from "@/lib/actions/category.actions";
import { getViewCounts } from "@/lib/actions/todo.actions";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [categories, viewCounts] = await Promise.all([
    getCategories(),
    getViewCounts(),
  ]);

  return (
    <AppShell categories={categories} viewCounts={viewCounts}>
      {children}
    </AppShell>
  );
}
