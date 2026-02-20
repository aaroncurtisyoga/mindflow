"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { items: true } },
    },
  });
}

export async function createCategory(name: string, color?: string) {
  const maxOrder = await prisma.category.aggregate({ _max: { sortOrder: true } });
  const category = await prisma.category.create({
    data: {
      name,
      color: color ?? "#3B82F6",
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
    },
  });
  revalidatePath("/");
  return category;
}

export async function updateCategory(id: string, data: { name?: string; color?: string; icon?: string; collapsed?: boolean }) {
  const category = await prisma.category.update({
    where: { id },
    data,
  });
  revalidatePath("/");
  return category;
}

export async function deleteCategory(id: string) {
  await prisma.category.delete({ where: { id } });
  revalidatePath("/");
}

export async function reorderCategories(orderedIds: string[]) {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.category.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );
  revalidatePath("/");
}
