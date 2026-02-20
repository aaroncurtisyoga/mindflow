import { google } from "googleapis";
import { getAuthedClient } from "./oauth";

export async function createCalendarEvent(data: {
  summary: string;
  description?: string;
  startDate: string;
  endDate?: string;
}) {
  const auth = await getAuthedClient();
  if (!auth) throw new Error("Google not connected");

  const calendar = google.calendar({ version: "v3", auth });

  const event = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: data.summary,
      description: data.description,
      start: { date: data.startDate },
      end: { date: data.endDate ?? data.startDate },
    },
  });

  return event.data;
}

export async function updateCalendarEvent(eventId: string, data: {
  summary?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}) {
  const auth = await getAuthedClient();
  if (!auth) throw new Error("Google not connected");

  const calendar = google.calendar({ version: "v3", auth });

  const requestBody: any = {};
  if (data.summary) requestBody.summary = data.summary;
  if (data.description) requestBody.description = data.description;
  if (data.startDate) requestBody.start = { date: data.startDate };
  if (data.endDate) requestBody.end = { date: data.endDate };

  const event = await calendar.events.patch({
    calendarId: "primary",
    eventId,
    requestBody,
  });

  return event.data;
}

export async function deleteCalendarEvent(eventId: string) {
  const auth = await getAuthedClient();
  if (!auth) throw new Error("Google not connected");

  const calendar = google.calendar({ version: "v3", auth });
  await calendar.events.delete({ calendarId: "primary", eventId });
}
