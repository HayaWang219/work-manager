import { Client } from '@notionhq/client';
import { getSystemState, getTasks, updateTask, createTask, setSystemState } from './db';
import type { Task } from './types';

export function getNotionClient(): Client | null {
  const token = getSystemState('notion_token');
  if (!token) return null;
  return new Client({ auth: token });
}

export function getNotionDatabaseId(): string | null {
  return getSystemState('notion_database_id');
}

export function isNotionConnected(): boolean {
  return !!(getSystemState('notion_token') && getSystemState('notion_database_id'));
}

function taskStatusToNotion(status: string): string {
  return status === 'done' ? 'Done' : 'Todo';
}

async function pushTask(client: Client, databaseId: string, task: Task): Promise<string> {
  const page = await client.pages.create({
    parent: { database_id: databaseId },
    properties: {
      Name: { title: [{ text: { content: task.title } }] },
      Status: { select: { name: taskStatusToNotion(task.status) } },
      Category: { select: task.category ? { name: task.category } : null } as never,
      ReportFlag: { checkbox: task.report_flag === 1 },
      IsToday: { checkbox: task.is_today === 1 },
      LocalId: { number: task.id },
    },
  });
  return page.id;
}

async function updateNotionPage(client: Client, pageId: string, task: Task): Promise<void> {
  await client.pages.update({
    page_id: pageId,
    properties: {
      Name: { title: [{ text: { content: task.title } }] },
      Status: { select: { name: taskStatusToNotion(task.status) } },
      Category: { select: task.category ? { name: task.category } : null } as never,
      ReportFlag: { checkbox: task.report_flag === 1 },
      IsToday: { checkbox: task.is_today === 1 },
    },
  });
}

export async function syncNotion(): Promise<{ pushed: number; pulled: number; errors: string[] }> {
  const client = getNotionClient();
  const databaseId = getNotionDatabaseId();
  if (!client || !databaseId) throw new Error('Notion not configured');

  const errors: string[] = [];
  let pushed = 0;
  let pulled = 0;

  // PUSH: local tasks without notion_page_id
  const unpushed = getTasks({ status: 'all' }).filter(t => !t.notion_page_id && t.status !== 'archived');
  for (const task of unpushed) {
    try {
      const pageId = await pushTask(client, databaseId, task);
      const now = new Date().toISOString();
      updateTask(task.id, { notion_page_id: pageId, notion_synced_at: now });
      pushed++;
    } catch (e) {
      errors.push(`Push task ${task.id}: ${e}`);
    }
  }

  // UPDATE: local tasks newer than last sync
  const synced = getTasks({ status: 'all' }).filter(t => t.notion_page_id && t.notion_synced_at && t.updated_at > t.notion_synced_at);
  for (const task of synced) {
    try {
      await updateNotionPage(client, task.notion_page_id!, task);
      updateTask(task.id, { notion_synced_at: new Date().toISOString() });
      pushed++;
    } catch (e) {
      errors.push(`Update task ${task.id}: ${e}`);
    }
  }

  // PULL: pages in Notion
  try {
    let cursor: string | undefined;
    do {
      const res = await client.databases.query({
        database_id: databaseId,
        start_cursor: cursor,
        page_size: 100,
      });

      for (const page of res.results) {
        if (page.object !== 'page') continue;
        const props = (page as { properties: Record<string, unknown> }).properties as Record<string, { type: string; title?: { plain_text: string }[]; select?: { name: string } | null; checkbox?: boolean; number?: number }>;

        const title = props.Name?.title?.[0]?.plain_text ?? '';
        const status = props.Status?.select?.name === 'Done' ? 'done' : 'todo';
        const category = props.Category?.select?.name ?? null;
        const reportFlag = props.ReportFlag?.checkbox ? 1 : 0;
        const isToday = props.IsToday?.checkbox ? 1 : 0;
        const localId = props.LocalId?.number;

        if (localId) {
          const local = getTasks({ status: 'all' }).find(t => t.id === localId);
          if (local && local.notion_synced_at && local.updated_at <= local.notion_synced_at) {
            updateTask(localId, {
              title,
              status: status as Task['status'],
              category: category ?? undefined,
              report_flag: reportFlag,
              is_today: isToday,
              notion_synced_at: new Date().toISOString(),
            });
            pulled++;
          }
        } else {
          createTask({ title, category: category ?? undefined, is_today: isToday, report_flag: reportFlag });
          pulled++;
        }
      }

      cursor = res.has_more ? res.next_cursor ?? undefined : undefined;
    } while (cursor);
  } catch (e) {
    errors.push(`Pull: ${e}`);
  }

  const now = new Date().toISOString();
  setSystemState('notion_last_sync', now);

  return { pushed, pulled, errors };
}
