"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Clock, ListChecks, User } from "@phosphor-icons/react";
import { actionLabel, formatTime } from "@/app/lib/format";
import { api } from "@/app/lib/api";
import type { CounterLog, Group, RealtimeEvent } from "@/app/lib/types";
import { RealtimeStatus, useRealtime } from "@/app/lib/useRealtime";
import { Button } from "@/app/components/ui/button";

const PAGE_SIZE = 20;

export function LogsScreen() {
  const searchParams = useSearchParams();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState(searchParams.get("groupId"));
  const [logs, setLogs] = useState<CounterLog[]>([]);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [error, setError] = useState("");
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>("closed");

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) ?? null,
    [groups, selectedGroupId],
  );

  const loadGroups = useCallback(async () => {
    const nextGroups = await api.listGroups();
    setGroups(nextGroups);
    setSelectedGroupId((current) => current ?? nextGroups[0]?.id ?? null);
  }, []);

  const loadLogs = useCallback(async (groupId: string, nextPage: number) => {
    const nextLogs = await api.listLogs(groupId, nextPage * PAGE_SIZE, PAGE_SIZE);
    setLogs(nextLogs);
    setPage(nextPage);
    setHasNextPage(nextLogs.length === PAGE_SIZE);
  }, []);

  useEffect(() => {
    loadGroups().catch((nextError: unknown) => setError(String(nextError)));
  }, [loadGroups]);

  useEffect(() => {
    if (!selectedGroupId) {
      return;
    }
    loadLogs(selectedGroupId, 0).catch((nextError: unknown) => setError(String(nextError)));
  }, [loadLogs, selectedGroupId]);

  const syncCurrentLogs = useCallback(() => {
    loadGroups().catch((nextError: unknown) => setError(String(nextError)));
    if (selectedGroupId) {
      loadLogs(selectedGroupId, page).catch((nextError: unknown) => setError(String(nextError)));
    }
  }, [loadGroups, loadLogs, page, selectedGroupId]);

  useRealtime(
    (event: RealtimeEvent) => {
      const log = event.log;
      const group = event.group;

      if (page === 0 && log && log.group_id === selectedGroupId) {
        setLogs((current) => [log, ...current].slice(0, PAGE_SIZE));
      }
      if (group) {
        setGroups((current) => upsertGroup(current, group));
      }
    },
    {
      onOpen: syncCurrentLogs,
      onStatusChange: setRealtimeStatus,
    },
  );

  return (
    <main className="flex min-h-dvh w-full flex-col bg-[var(--canvas)]">
      <header className="px-5 pb-4 pt-5">
        <Link className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--primary)]" href="/">
          <ArrowLeft size={15} weight="bold" />
          Về Count
        </Link>
        <div className="mt-4 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ListChecks className="text-[var(--primary)]" size={22} weight="duotone" />
              <h1 className="text-[28px] font-black leading-none -tracking-[0.5px] uppercase">
                Log
              </h1>
            </div>
            <p className="mt-1.5 text-sm text-[var(--mute)]">{selectedGroup?.name ?? "Chọn nhóm"}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium text-[var(--badge-success)]">
            <span className="h-[6px] w-[6px] rounded-full bg-[var(--badge-success)]" />
            {realtimeStatus === "live" ? "Live" : "Đang nối"}
          </span>
        </div>
        {error ? (
          <p className="mt-3 rounded-[10px] bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
            {error}
          </p>
        ) : null}
      </header>
      <section className="border-b border-[var(--hairline)] py-3">
        <div className="flex gap-2 overflow-x-auto">
          {groups.map((group) => (
            <button
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition active:scale-95 ${
                group.id === selectedGroupId
                  ? "border-[var(--surface-dark)] bg-[var(--surface-dark)] text-[var(--on-dark)]"
                  : "border-[var(--hairline)] bg-[var(--surface-card)] text-[var(--ink)]"
              }`}
              key={group.id}
              onClick={() => setSelectedGroupId(group.id)}
              type="button"
            >
              {group.name}
            </button>
          ))}
        </div>
      </section>
      <section className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
        {logs.length === 0 ? (
          <p className="rounded-[10px] border border-[var(--hairline)] bg-[var(--surface-card)] p-5 text-sm text-[var(--mute)]">
            Chưa có log.
          </p>
        ) : null}
        {logs.map((log) => (
          <article
            className="animate-item-in rounded-[10px] border border-[var(--hairline)] bg-[var(--surface-card)] p-4"
            key={log.id}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">
                {actionLabel(log.action)}
              </span>
              <time className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--mute)]">
                <Clock size={11} weight="bold" />
                {formatTime(log.created_at)}
              </time>
            </div>
            <p className="mt-1 text-sm text-[var(--body)]">{log.message}</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="inline-flex items-center gap-1 font-mono text-xs text-[var(--mute)]">
                <User size={11} weight="bold" />
                {log.actor_name}
              </span>
              {log.delta ? (
                <span className="font-mono text-xs text-[var(--primary)]">
                  {log.old_value} → {log.new_value} ({log.delta > 0 ? "+" : ""}
                  {log.delta})
                </span>
              ) : null}
            </div>
          </article>
        ))}
        <div className="grid grid-cols-2 gap-2 pt-3">
          <Button
            disabled={page === 0 || !selectedGroupId}
            onClick={() => selectedGroupId && loadLogs(selectedGroupId, page - 1)}
            type="button"
            variant="outline"
          >
            Trước
          </Button>
          <Button
            disabled={!hasNextPage || !selectedGroupId}
            onClick={() => selectedGroupId && loadLogs(selectedGroupId, page + 1)}
            type="button"
          >
            Sau
          </Button>
        </div>
        <p className="pb-3 pt-1 text-center font-mono text-[11px] text-[var(--mute)]">
          Trang {page + 1} · tối đa {PAGE_SIZE} log
        </p>
      </section>
    </main>
  );
}

function upsertGroup(groups: Group[], group: Group): Group[] {
  const exists = groups.some((item) => item.id === group.id);
  if (!exists) {
    return [group, ...groups];
  }
  return groups.map((item) => (item.id === group.id ? group : item));
}
