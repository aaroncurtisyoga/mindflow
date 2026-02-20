import { getCategories } from "@/lib/actions/category.actions";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();

  return <AppShell categories={categories}>{children}</AppShell>;
}
