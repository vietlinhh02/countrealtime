"use client";

import { useCallback, useState } from "react";
import { ArrowCounterClockwise, Clock, DotsThree, Minus, Plus, Trash, TreeStructure, User, X } from "@phosphor-icons/react";
import type { Counter, CounterLog } from "@/app/lib/types";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent } from "@/app/components/ui/dialog";
import { DropdownMenu } from "@/app/components/ui/dropdown-menu";
import { api } from "@/app/lib/api";
import { actionLabel, formatTime } from "@/app/lib/format";

type Props = {
  className?: string;
  counter: Counter;
  children?: React.ReactNode;
  compact?: boolean;
  isAdmin?: boolean;
  selected?: boolean;
  selectMode?: boolean;
  onDecrement: (counterId: string) => Promise<Counter>;
  onDelete: (counterId: string) => Promise<void>;
  onIncrement: (counterId: string) => Promise<Counter>;
  onRename: (counterId: string, name: string) => Promise<Counter>;
  onReset: (counterId: string) => Promise<Counter>;
  onCreateSub: (parentId: string, name: string) => Promise<void>;
  onToggleSelect?: (counterId: string) => void;
};

function vibrate() {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(10);
  }
}

export function CounterCard({
  className = "",
  counter,
  children,
  compact = false,
  isAdmin = false,
  selected = false,
  selectMode = false,
  onDecrement,
  onDelete,
  onIncrement,
  onRename,
  onReset,
  onCreateSub,
  onToggleSelect,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showCreateSub, setShowCreateSub] = useState(false);
  const [subName, setSubName] = useState("");
  const [logs, setLogs] = useState<CounterLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const rename = async (name: string) => {
    const nextName = name.trim();
    if (!nextName || nextName === counter.name || isSaving) return;
    setIsSaving(true);
    try {
      await onRename(counter.id, nextName);
    } finally {
      setIsSaving(false);
    }
  };

  const changeValue = (delta: 1 | -1) => {
    vibrate();
    if (delta > 0) onIncrement(counter.id);
    else onDecrement(counter.id);
  };

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const data = await api.listCounterLogs(counter.id, 0, 20);
      setLogs(data);
    } finally {
      setLogsLoading(false);
    }
  }, [counter.id]);

  const openLogs = () => {
    setShowLogs(true);
    loadLogs();
  };

  const handleCreateSub = async () => {
    const name = subName.trim();
    if (!name) return;
    await onCreateSub(counter.id, name);
    setSubName("");
    setShowCreateSub(false);
  };

  return (
    <>
      <article
        className={`rounded-[10px] border bg-[var(--surface-card)] ${
          compact ? "px-3 py-2" : "px-4 py-3.5"
        } ${selected ? "border-[var(--ink)]" : "border-[var(--hairline)]"} ${className}`}
        onClick={() => selectMode && onToggleSelect?.(counter.id)}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {selectMode ? (
              <div
                className={`flex ${compact ? "h-4 w-4" : "h-5 w-5"} shrink-0 items-center justify-center rounded border ${
                  selected
                    ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                    : "border-[var(--stone)] bg-[var(--surface-card)]"
                }`}
              >
                {selected && (
                  <svg width={compact ? 10 : 12} height={compact ? 10 : 12} viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            ) : null}
            {compact ? (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--mute)]" />
            ) : null}
            <input
              className={`min-w-0 flex-1 truncate bg-transparent outline-none text-[var(--ink)] ${
                compact ? "text-[13px] font-medium" : "text-[15px] font-semibold"
              }`}
              defaultValue={counter.name}
              key={counter.name}
              maxLength={80}
              onBlur={(event) => rename(event.target.value)}
              onClick={(e) => selectMode && e.stopPropagation()}
              readOnly={selectMode}
            />
            {!selectMode ? (
              <DropdownMenu
                align="right"
                trigger={
                  <button
                    className={`rounded-full text-[var(--stone)] hover:bg-[var(--surface-bone)] hover:text-[var(--ink)] ${compact ? "p-1" : "p-1.5"}`}
                    type="button"
                  >
                    <DotsThree size={compact ? 14 : 16} weight="bold" />
                  </button>
                }
                items={[
                  {
                    icon: <Clock size={14} weight="bold" />,
                    label: "Nhật ký",
                    onClick: openLogs,
                  },
                  ...(!counter.parent_id
                    ? [
                        {
                          icon: <TreeStructure size={14} weight="bold" />,
                          label: "Tạo con",
                          onClick: () => setShowCreateSub(true),
                        },
                      ]
                    : []),
                  ...(isAdmin
                    ? [
                        {
                          icon: <ArrowCounterClockwise size={14} weight="bold" />,
                          label: "Đặt lại",
                          onClick: () => onReset(counter.id),
                        },
                        {
                          icon: <Trash size={14} weight="bold" />,
                          label: "Xóa",
                          onClick: () => setShowDelete(true),
                          variant: "danger" as const,
                        },
                      ]
                    : []),
                ]}
              />
            ) : null}
          </div>
          <div className={`font-mono font-bold leading-none tabular-nums -tracking-[0.5px] text-[var(--ink)] ${
            compact ? "text-[22px]" : "text-[32px]"
          }`}>
            {counter.value}
          </div>
        </div>
        {!selectMode ? (
          <div className={`grid grid-cols-2 ${compact ? "mt-2 gap-1.5" : "mt-3 gap-2"}`}>
            <Button
              onClick={(e) => { e.stopPropagation(); changeValue(-1); }}
              size="sm"
              type="button"
              variant="muted"
              className={compact ? "h-8 text-xs" : ""}
            >
              <Minus size={compact ? 14 : 18} weight="bold" />
            </Button>
            <Button
              onClick={(e) => { e.stopPropagation(); changeValue(1); }}
              size="sm"
              type="button"
              className={compact ? "h-8 text-xs" : ""}
            >
              <Plus size={compact ? 14 : 18} weight="bold" />
            </Button>
          </div>
        ) : null}
        {children}
      </article>

      {showLogs ? (
        <Dialog isOpen>
          <DialogContent>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black -tracking-[0.5px]">
                {counter.name}
              </h2>
              <button
                className="text-[var(--mute)]"
                onClick={() => setShowLogs(false)}
                type="button"
              >
                <X size={18} weight="bold" />
              </button>
            </div>
            <p className="mt-1 font-mono text-[11px] text-[var(--ash)]">
              Giá trị hiện tại: {counter.value}
            </p>
            <div className="mt-3 max-h-60 space-y-2 overflow-y-auto scrollbar-none">
              {logsLoading ? (
                <p className="text-xs text-[var(--mute)]">Đang tải...</p>
              ) : logs.length === 0 ? (
                <p className="text-xs text-[var(--mute)]">Chưa có log.</p>
              ) : (
                logs.map((log) => (
                  <div className="flex items-start justify-between gap-2" key={log.id}>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold">{actionLabel(log.action)}</p>
                      <p className="truncate text-xs text-[var(--body)]">{log.message}</p>
                      <p className="font-mono text-[10px] text-[var(--mute)]">
                        <User size={10} className="mr-0.5 inline" />{log.actor_name}
                      </p>
                    </div>
                    <time className="shrink-0 font-mono text-[10px] text-[var(--ash)]">
                      {formatTime(log.created_at)}
                    </time>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      ) : null}

      {showDelete ? (
        <Dialog isOpen>
          <DialogContent>
            <h2 className="text-xl font-black -tracking-[0.5px]">
              Xóa &quot;{counter.name}&quot;?
            </h2>
            <p className="mt-2 text-sm text-[var(--mute)]">
              Giá trị hiện tại: {counter.value}. Không thể hoàn tác.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button onClick={() => setShowDelete(false)} type="button" variant="muted">Hủy</Button>
              <Button onClick={() => { onDelete(counter.id); setShowDelete(false); }} type="button" className="bg-red-600 text-white">Xóa</Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}

      {showCreateSub ? (
        <Dialog isOpen>
          <DialogContent>
            <h2 className="text-xl font-black -tracking-[0.5px]">Tạo bộ đếm con</h2>
            <p className="mt-1 text-sm text-[var(--mute)]">
              Thêm con cho &quot;{counter.name}&quot;
            </p>
            <input
              autoFocus
              className="mt-3 h-12 w-full rounded-full border border-[var(--hairline)] bg-[var(--canvas)] px-5 text-base font-semibold text-[var(--ink)] outline-none placeholder:text-[var(--ash)]"
              maxLength={80}
              onChange={(e) => setSubName(e.target.value)}
              placeholder="Tên bộ đếm con"
              value={subName}
            />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button onClick={() => setShowCreateSub(false)} type="button" variant="muted">Hủy</Button>
              <Button onClick={handleCreateSub} type="button">Tạo</Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
