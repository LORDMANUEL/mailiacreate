import ICAL from "ical.js";
import { z } from "zod";

const nextcloudEnv = z.object({
  NEXTCLOUD_CALDAV_URL: z.string().url().optional(),
  NEXTCLOUD_USERNAME: z.string().optional(),
  NEXTCLOUD_PASSWORD: z.string().optional(),
  NEXTCLOUD_TASKS_URL: z.string().url().optional()
});

const nextcloudConfig = nextcloudEnv.parse({
  NEXTCLOUD_CALDAV_URL:
    process.env.WEBMAIL_NEXTCLOUD_CALDAV_URL || process.env.NEXTCLOUD_CALDAV_URL || undefined,
  NEXTCLOUD_USERNAME: process.env.WEBMAIL_NEXTCLOUD_USERNAME || process.env.NEXTCLOUD_USERNAME,
  NEXTCLOUD_PASSWORD: process.env.WEBMAIL_NEXTCLOUD_PASSWORD || process.env.NEXTCLOUD_PASSWORD,
  NEXTCLOUD_TASKS_URL:
    process.env.WEBMAIL_NEXTCLOUD_TASKS_URL || process.env.NEXTCLOUD_TASKS_URL || undefined
});

export type CalendarEvent = {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
};

export type TaskItem = {
  id: string;
  title: string;
  due?: string;
  completed: boolean;
};

async function fetchIcs(url?: string): Promise<string | null> {
  if (!url) return null;
  const headers: Record<string, string> = {};
  if (nextcloudConfig.NEXTCLOUD_USERNAME && nextcloudConfig.NEXTCLOUD_PASSWORD) {
    headers.Authorization = `Basic ${Buffer.from(`${nextcloudConfig.NEXTCLOUD_USERNAME}:${nextcloudConfig.NEXTCLOUD_PASSWORD}`).toString("base64")}`;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  return res.text();
}

export async function getEvents(limit = 10): Promise<CalendarEvent[]> {
  const ics = await fetchIcs(nextcloudConfig.NEXTCLOUD_CALDAV_URL);
  if (!ics) return [];
  const jcalData = ICAL.parse(ics);
  const component = new ICAL.Component(jcalData);
  const events = component.getAllSubcomponents("vevent");
  return events
    .slice(0, limit)
    .map((event) => new ICAL.Event(event))
    .map((event) => ({
      id: event.uid || event.summary,
      summary: event.summary || "(Sin título)",
      description: event.description || undefined,
      start: event.startDate?.toString() ?? "",
      end: event.endDate?.toString() ?? "",
      location: event.location || undefined
    }));
}

export async function getTasks(limit = 10): Promise<TaskItem[]> {
  const ics = await fetchIcs(nextcloudConfig.NEXTCLOUD_TASKS_URL);
  if (!ics) return [];
  const jcalData = ICAL.parse(ics);
  const component = new ICAL.Component(jcalData);
  const tasks = component.getAllSubcomponents("vtodo");
  return tasks.slice(0, limit).map((todo) => {
    const task = new ICAL.Todo(todo);
    return {
      id: task.uid || task.summary,
      title: task.summary || "(Tarea sin nombre)",
      due: task.due?.toString() ?? undefined,
      completed: task.isCompleted()
    } as TaskItem;
  });
}
