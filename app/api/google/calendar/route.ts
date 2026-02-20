import { NextResponse, type NextRequest } from "next/server";
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "@/lib/google/calendar";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { todoId, summary, description, startDate, endDate } = await request.json();

  const event = await createCalendarEvent({ summary, description, startDate, endDate });

  if (todoId && event.id) {
    await prisma.todoItem.update({
      where: { id: todoId },
      data: { googleCalendarEventId: event.id },
    });
  }

  return NextResponse.json(event);
}

export async function PATCH(request: NextRequest) {
  const { eventId, ...data } = await request.json();
  const event = await updateCalendarEvent(eventId, data);
  return NextResponse.json(event);
}

export async function DELETE(request: NextRequest) {
  const { eventId } = await request.json();
  await deleteCalendarEvent(eventId);
  return NextResponse.json({ deleted: true });
}
