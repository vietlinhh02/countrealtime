"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowClockwise, SignOut } from "@phosphor-icons/react";
import { CounterBoard } from "@/app/components/CounterBoard";
import { GroupBar } from "@/app/components/GroupBar";
import { NameModal } from "@/app/components/NameModal";
import { NameGate } from "@/app/components/NameGate";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent } from "@/app/components/ui/dialog";
import { api } from "@/app/lib/api";
import type { Counter, Group, RealtimeEvent } from "@/app/lib/types";
import { RealtimeStatus, useRealtime } from "@/app/lib/useRealtime";

const NAME_KEY = "countrealtime.name";
const GROUP_KEY = "countrealtime.selectedGroupId";
const ADMIN_KEY = "countrealtime.isAdmin";
type ModalState = "create-group" | "rename-group" | "create-counter" | "reset-session" | "delete-group" | null;

export function CounterApp() {
  const [hasBooted, setHasBooted] = useState(false);
  const [actorName, setActorName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [modal, setModal] = useState<ModalState>(null);
  const [error, setError] = useState("");
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>("closed");

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) ?? null,
    [groups, selectedGroupId],
  );

  const loadGroups = useCallback(async () => {
    const nextGroups = await api.listGroups();
    const storedGroupId = localStorage.getItem(GROUP_KEY);
    const fallbackGroupId = nextGroups[0]?.id ?? null;
    const nextGroupId = nextGroups.some((group) => group.id === storedGroupId)
      ? storedGroupId
      : fallbackGroupId;
    setGroups(nextGroups);
    setSelectedGroupId((current) => current ?? nextGroupId);
  }, []);

  const loadDetail = useCallback(async (groupId: string) => {
    const detail = await api.getGroup(groupId);
    setCounters(detail.counters);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setActorName(localStorage.getItem(NAME_KEY) ?? "");
      setIsAdmin(localStorage.getItem(ADMIN_KEY) === "true");
      setHasBooted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!actorName) {
      return;
    }
    loadGroups().catch((nextError: unknown) => setError(String(nextError)));
  }, [actorName, loadGroups]);

  useEffect(() => {
    if (!selectedGroupId) {
      return;
    }
    localStorage.setItem(GROUP_KEY, selectedGroupId);
    loadDetail(selectedGroupId).catch((nextError: unknown) => setError(String(nextError)));
  }, [loadDetail, selectedGroupId]);

  const syncCurrentGroup = useCallback(() => {
    loadGroups().catch((nextError: unknown) => setError(String(nextError)));
    if (selectedGroupId) {
      loadDetail(selectedGroupId).catch((nextError: unknown) => setError(String(nextError)));
    }
  }, [loadDetail, loadGroups, selectedGroupId]);

  useRealtime(
    (event: RealtimeEvent) => {
      const group = event.group;
      const counter = event.counter;

      if (event.type === "group_deleted" && event.group_id) {
        setGroups((current) => current.filter((g) => g.id !== event.group_id));
        if (selectedGroupId === event.group_id) {
          setSelectedGroupId(null);
          setCounters([]);
        }
        return;
      }
      if (event.type === "counter_deleted" && event.counter_id) {
        setCounters((current) => current.filter((c) => c.id !== event.counter_id));
        return;
      }
      if (group) {
        setGroups((current) => upsertGroup(current, group));
      }
      if (counter && counter.group_id === selectedGroupId) {
        setCounters((current) => upsertCounter(current, counter));
      }
    },
    {
      enabled: Boolean(actorName),
      onOpen: syncCurrentGroup,
      onStatusChange: setRealtimeStatus,
    },
  );

  const saveName = (name: string, admin: boolean) => {
    localStorage.setItem(NAME_KEY, name);
    localStorage.setItem(ADMIN_KEY, String(admin));
    setActorName(name);
    setIsAdmin(admin);
  };

  const logout = () => {
    localStorage.removeItem(NAME_KEY);
    localStorage.removeItem(ADMIN_KEY);
    localStorage.removeItem(GROUP_KEY);
    setActorName("");
    setIsAdmin(false);
    setGroups([]);
    setSelectedGroupId(null);
    setCounters([]);
  };

  const clearName = async () => {
    const name = actorName;
    for (const group of groups) {
      try {
        await api.deleteGroup(group.id, name);
      } catch {
        // ignore
      }
    }
    localStorage.removeItem(NAME_KEY);
    localStorage.removeItem(GROUP_KEY);
    setActorName("");
    setGroups([]);
    setSelectedGroupId(null);
    setCounters([]);
    setModal(null);
    try {
      const group = await api.createGroup("Nhóm 1", name);
      setGroups([group]);
      setSelectedGroupId(group.id);
      const counter = await api.createCounter(group.id, "Bộ đếm 1", name);
      setCounters([counter]);
    } catch (nextError: unknown) {
      setError(String(nextError));
    }
    setActorName(name);
    localStorage.setItem(NAME_KEY, name);
  };

  const createGroup = async (name: string) => {
    const group = await api.createGroup(name, actorName);
    setGroups((current) => upsertGroup(current, group));
    setSelectedGroupId(group.id);
  };

  const renameGroup = async (name: string) => {
    if (!selectedGroupId) return;
    const group = await api.renameGroup(selectedGroupId, name, actorName);
    setGroups((current) => upsertGroup(current, group));
  };

  const deleteGroup = async () => {
    if (!selectedGroupId) return;
    await api.deleteGroup(selectedGroupId, actorName);
    setGroups((current) => current.filter((g) => g.id !== selectedGroupId));
    setSelectedGroupId(null);
    setCounters([]);
    setModal(null);
  };

  const deleteCounter = async (counterId: string) => {
    await api.deleteCounter(counterId, actorName);
    setCounters((current) => current.filter((c) => c.id !== counterId));
  };

  const createCounter = async (name: string) => {
    if (!selectedGroupId) return;
    const counter = await api.createCounter(selectedGroupId, name, actorName);
    setCounters((current) => upsertCounter(current, counter));
  };

  const createSubCounter = async (parentId: string, name: string) => {
    if (!selectedGroupId) return;
    const counter = await api.createCounter(selectedGroupId, name, actorName, parentId);
    setCounters((current) => upsertCounter(current, counter));
  };

  const changeCounter = async (counterId: string, delta: 1 | -1) => {
    try {
      const counter =
        delta > 0 ? await api.increment(counterId, actorName) : await api.decrement(counterId, actorName);
      setCounters((current) => upsertCounter(current, counter));
      return counter;
    } catch (nextError) {
      setError(String(nextError));
      throw nextError;
    }
  };

  const resetCounter = async (counterId: string) => {
    try {
      const counter = await api.resetCounter(counterId, actorName);
      setCounters((current) => upsertCounter(current, counter));
      return counter;
    } catch (nextError) {
      setError(String(nextError));
      throw nextError;
    }
  };

  const renameCounter = async (counterId: string, name: string) => {
    const counter = await api.renameCounter(counterId, name, actorName);
    setCounters((current) => upsertCounter(current, counter));
    return counter;
  };

  if (!hasBooted) {
    return (
      <main className="flex min-h-dvh w-full items-center justify-center bg-[var(--canvas)]">
        <div className="h-10 w-10 animate-pulse rounded-full border-4 border-[var(--surface-bone)] border-t-[var(--primary)]" />
      </main>
    );
  }

  if (!actorName) {
    return <NameGate onSubmit={saveName} />;
  }

  return (
    <main className="flex min-h-dvh w-full flex-col bg-[var(--canvas)]">
      <header className="border-b border-[var(--hairline)] bg-[var(--canvas)] px-5 py-3">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-[20px] font-black leading-tight -tracking-[0.5px] uppercase">
            COUNT
          </h1>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] text-[var(--ash)]">
              {counters.length}
            </span>
            {isAdmin ? (
              <span className="rounded-full bg-[var(--ink)] px-2 py-1 text-[10px] font-semibold text-white">
                ADMIN
              </span>
            ) : null}
            {realtimeStatus === "live" ? (
              <span className="flex h-[6px] w-[6px]">
                <span className="animate-ping absolute inline-flex h-[6px] w-[6px] rounded-full bg-[var(--badge-success)] opacity-75" />
                <span className="relative inline-flex h-[6px] w-[6px] rounded-full bg-[var(--badge-success)]" />
              </span>
            ) : (
              <span className="h-[6px] w-[6px] rounded-full bg-[var(--mute)]" />
            )}
            <Button
              aria-label="Đăng xuất"
              onClick={logout}
              size="icon"
              type="button"
              variant="ghost"
              className="h-8 w-8"
            >
              <SignOut size={14} weight="bold" />
            </Button>
            <Button
              aria-label="Reset phiên"
              onClick={() => setModal("reset-session")}
              size="icon"
              type="button"
              variant="ghost"
              className="h-8 w-8"
            >
              <ArrowClockwise size={14} weight="bold" />
            </Button>
          </div>
        </div>
        {error ? (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
            {error}
          </p>
        ) : null}
      </header>
      <GroupBar
        actorName={actorName}
        groups={groups}
        selectedGroupId={selectedGroupId}
        isAdmin={isAdmin}
        onOpenCreateGroup={() => setModal("create-group")}
        onOpenRenameGroup={() => setModal("rename-group")}
        onOpenDeleteGroup={() => setModal("delete-group")}
        onSelectGroup={setSelectedGroupId}
      />
      <CounterBoard
        actorName={actorName}
        counters={counters}
        group={selectedGroup}
        isAdmin={isAdmin}
        onDecrement={(counterId) => changeCounter(counterId, -1)}
        onIncrement={(counterId) => changeCounter(counterId, 1)}
        onOpenCreateCounter={() => setModal("create-counter")}
        onDeleteCounter={deleteCounter}
        onRenameCounter={renameCounter}
        onResetCounter={resetCounter}
        onCreateSubCounter={createSubCounter}
      />
      <NameModal
        buttonLabel="Tạo nhóm"
        isOpen={modal === "create-group"}
        key="create-group"
        onClose={() => setModal(null)}
        onSubmit={createGroup}
        placeholder="Tên nhóm"
        title="Tạo nhóm mới"
      />
      <NameModal
        buttonLabel="Lưu tên"
        initialValue={selectedGroup?.name}
        isOpen={modal === "rename-group"}
        key={`rename-group-${selectedGroup?.id ?? "none"}-${selectedGroup?.name ?? ""}`}
        onClose={() => setModal(null)}
        onSubmit={renameGroup}
        placeholder="Tên nhóm"
        title="Đổi tên nhóm"
      />
      <NameModal
        buttonLabel="Thêm bộ đếm"
        isOpen={modal === "create-counter"}
        key="create-counter"
        onClose={() => setModal(null)}
        onSubmit={createCounter}
        placeholder="Tên bộ đếm"
        title="Thêm bộ đếm"
      />
      {modal === "reset-session" ? (
        <Dialog isOpen>
          <DialogContent>
            <h2 className="text-xl font-black -tracking-[0.5px]">
              Reset phiên này?
            </h2>
            <p className="mt-2 text-sm text-[var(--mute)]">
              Xóa toàn bộ dữ liệu trên server và tạo lại nhóm mặc định.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button onClick={() => setModal(null)} type="button" variant="muted">
                Hủy
              </Button>
              <Button onClick={clearName} type="button">
                Reset
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
      {modal === "delete-group" ? (
        <Dialog isOpen>
          <DialogContent>
            <h2 className="text-xl font-black -tracking-[0.5px]">
              Xóa nhóm &quot;{selectedGroup?.name}&quot;?
            </h2>
            <p className="mt-2 text-sm text-[var(--mute)]">
              Tất cả bộ đếm và log sẽ bị xóa vĩnh viễn.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button onClick={() => setModal(null)} type="button" variant="muted">
                Hủy
              </Button>
              <Button onClick={deleteGroup} type="button" className="bg-red-600 text-white">
                Xóa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
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

function upsertCounter(counters: Counter[], counter: Counter): Counter[] {
  const exists = counters.some((item) => item.id === counter.id);
  if (!exists) {
    return [...counters, counter];
  }
  return counters.map((item) => (item.id === counter.id ? counter : item));
}
