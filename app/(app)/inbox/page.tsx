import { getCategories } from "@/lib/actions/category.actions";
import { redirect } from "next/navigation";
import { EmptyInbox } from "@/components/todos/EmptyInbox";

export default async function InboxPage() {
  const categories = await getCategories();

  if (categories.length > 0) {
    redirect(`/category/${categories[0].id}`);
  }

  return <EmptyInbox />;
}
