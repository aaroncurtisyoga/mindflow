"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function reorderTodos(
  orderedItems: { id: string; sortOrder: number; parentId: string | null; depth: number }[]
) {
  await prisma.$transaction(
    orderedItems.map((item) =>
      prisma.todoItem.update({
        where: { id: item.id },
        data: {
          sortOrder: item.sortOrder,
          parentId: item.parentId,
          depth: item.depth,
        },
      })
    )
  );
  revalidatePath("/");
}

export async function moveTodoToCategory(todoId: string, categoryId: string) {
  const maxOrder = await prisma.todoItem.aggregate({
    where: { categoryId },
    _max: { sortOrder: true },
  });
  await prisma.todoItem.update({
    where: { id: todoId },
    data: {
      categoryId,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      parentId: null,
      depth: 0,
    },
  });
  revalidatePath("/");
}
