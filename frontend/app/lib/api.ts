import type { Counter, CounterLog, Group, GroupDetail } from "@/app/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type Body = Record<string, string | number>;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function body(payload: Body): string {
  return JSON.stringify(payload);
}

export const wsUrl = () => {
  const url = new URL(API_BASE);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws";
  return url.toString();
};

export const api = {
  login: (password: string) =>
    request<{ is_admin: boolean }>("/auth/login", {
      method: "POST",
      body: body({ password }),
    }),
  listGroups: () => request<Group[]>("/groups"),
  getGroup: (groupId: string) => request<GroupDetail>(`/groups/${groupId}`),
  listCounters: (groupId: string) => request<Counter[]>(`/groups/${groupId}/counters`),
  createGroup: (name: string, actorName: string) =>
    request<Group>("/groups", {
      method: "POST",
      body: body({ name, actor_name: actorName }),
    }),
  renameGroup: (groupId: string, name: string, actorName: string) =>
    request<Group>(`/groups/${groupId}`, {
      method: "PATCH",
      body: body({ name, actor_name: actorName }),
    }),
  createCounter: (groupId: string, name: string, actorName: string, parentId?: string) =>
    request<Counter>(`/groups/${groupId}/counters`, {
      method: "POST",
      body: body({ name, actor_name: actorName, parent_id: parentId ?? null }),
    }),
  renameCounter: (counterId: string, name: string, actorName: string) =>
    request<Counter>(`/counters/${counterId}`, {
      method: "PATCH",
      body: body({ name, actor_name: actorName }),
    }),
  increment: (counterId: string, actorName: string) =>
    request<Counter>(`/counters/${counterId}/increment`, {
      method: "POST",
      body: body({ actor_name: actorName }),
    }),
  decrement: (counterId: string, actorName: string) =>
    request<Counter>(`/counters/${counterId}/decrement`, {
      method: "POST",
      body: body({ actor_name: actorName }),
    }),
  resetCounter: (counterId: string, actorName: string) =>
    request<Counter>(`/counters/${counterId}/reset`, {
      method: "POST",
      body: body({ actor_name: actorName }),
    }),
  listLogs: (groupId: string, offset = 0, limit = 20) =>
    request<CounterLog[]>(`/groups/${groupId}/logs?offset=${offset}&limit=${limit}`),
  listCounterLogs: (counterId: string, offset = 0, limit = 20) =>
    request<CounterLog[]>(`/counters/${counterId}/logs?offset=${offset}&limit=${limit}`),
  deleteGroup: (groupId: string, actorName: string) =>
    request<void>(`/groups/${groupId}?actor_name=${encodeURIComponent(actorName)}`, {
      method: "DELETE",
    }),
  deleteCounter: (counterId: string, actorName: string) =>
    request<void>(`/counters/${counterId}?actor_name=${encodeURIComponent(actorName)}`, {
      method: "DELETE",
    }),
};
