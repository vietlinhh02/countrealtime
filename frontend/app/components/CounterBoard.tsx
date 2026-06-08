"use client";

import { useState } from "react";
import { Minus, Plus, SquaresFour, ListBullets, X } from "@phosphor-icons/react";
import { CounterCard } from "@/app/components/CounterCard";
import type { Counter, Group } from "@/app/lib/types";
import { Button } from "@/app/components/ui/button";

type Props = {
  actorName: string;
  counters: Counter[];
  group: Group | null;
  isAdmin: boolean;
  onDecrement: (counterId: string) => Promise<Counter>;
  onIncrement: (counterId: string) => Promise<Counter>;
  onOpenCreateCounter: () => void;
  onDeleteCounter: (counterId: string) => Promise<void>;
  onRenameCounter: (counterId: string, name: string) => Promise<Counter>;
  onResetCounter: (counterId: string) => Promise<Counter>;
  onCreateSubCounter: (parentId: string, name: string) => Promise<void>;
};

function vibrate() {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(10);
  }
}

type ViewMode = "list" | "grid";
type GridCols = 1 | 2 | 3 | 4;

const COL_OPTIONS: GridCols[] = [1, 2, 3, 4];
const COL_CLASS: Record<GridCols, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
};

export function CounterBoard({
  counters,
  group,
  isAdmin,
  onDecrement,
  onIncrement,
  onOpenCreateCounter,
  onDeleteCounter,
  onRenameCounter,
  onResetCounter,
  onCreateSubCounter,
}: Props) {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [gridCols, setGridCols] = useState<GridCols>(2);

  const toggleSelect = (counterId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(counterId)) {
        next.delete(counterId);
      } else {
        next.add(counterId);
      }
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const batchChange = async (delta: 1 | -1) => {
    vibrate();
    const ids = Array.from(selectedIds);
    await Promise.allSettled(
      ids.map((id) => (delta > 0 ? onIncrement(id) : onDecrement(id))),
    );
  };

  const allSelected = counters.length > 0 && selectedIds.size === counters.length;

  const rootCounters = counters.filter((c) => !c.parent_id);
  const childrenOf = (parentId: string) => counters.filter((c) => c.parent_id === parentId);

  const renderCounter = (counter: Counter, compact = false) => {
    const children = childrenOf(counter.id);
    return (
      <div key={counter.id}>
        <CounterCard
          className={compact ? "!border-0 !bg-[var(--surface-bone)]/60 !px-3 !py-2" : "animate-item-in"}
          counter={counter}
          compact={compact}
          isAdmin={isAdmin}
          selected={selectedIds.has(counter.id)}
          selectMode={selectMode}
          onDecrement={onDecrement}
          onDelete={onDeleteCounter}
          onIncrement={onIncrement}
          onRename={onRenameCounter}
          onReset={onResetCounter}
          onCreateSub={onCreateSubCounter}
          onToggleSelect={toggleSelect}
        >
          {children.length > 0 ? (
            <div className="mt-2 space-y-1.5">
              {children.map((child) => renderCounter(child, true))}
            </div>
          ) : null}
        </CounterCard>
      </div>
    );
  };

  return (
    <section className="flex-1 px-5 py-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {counters.length > 0 && !selectMode ? (
            <button
              className="rounded-full px-2 py-1 text-[11px] font-semibold text-[var(--primary)]"
              onClick={() => setSelectMode(true)}
              type="button"
            >
              Chọn
            </button>
          ) : null}
          <button
            className={`rounded-full p-1.5 ${viewMode === "list" ? "bg-[var(--surface-bone)] text-[var(--ink)]" : "text-[var(--mute)]"}`}
            onClick={() => setViewMode("list")}
            type="button"
          >
            <ListBullets size={15} weight="bold" />
          </button>
          <button
            className={`rounded-full p-1.5 ${viewMode === "grid" ? "bg-[var(--surface-bone)] text-[var(--ink)]" : "text-[var(--mute)]"}`}
            onClick={() => setViewMode("grid")}
            type="button"
          >
            <SquaresFour size={15} weight="bold" />
          </button>
          {viewMode === "grid" ? (
            <div className="ml-1 flex items-center gap-0.5">
              {COL_OPTIONS.map((n) => (
                <button
                  key={n}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${gridCols === n ? "bg-[var(--ink)] text-white" : "text-[var(--mute)]"}`}
                  onClick={() => setGridCols(n)}
                  type="button"
                >
                  {n}
                </button>
              ))}
              {gridCols >= 3 ? (
                <span className="ml-1 text-[9px] text-[var(--ash)] sm:hidden">Xoay ngang</span>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="shrink-0 rounded-full bg-[var(--surface-bone)] px-2.5 py-1 font-mono text-[11px] font-medium text-[var(--charcoal)]">
          {counters.length}
        </div>
      </div>

      {selectMode ? (
        <div className="mb-3 flex items-center gap-2">
          <Button
            onClick={() =>
              setSelectedIds(
                allSelected ? new Set() : new Set(counters.map((c) => c.id)),
              )
            }
            size="sm"
            type="button"
            variant="outline"
          >
            {allSelected ? "Bỏ chọn" : "Chọn tất cả"}
          </Button>
          <div className="flex-1" />
          <span className="font-mono text-xs text-[var(--mute)]">
            {selectedIds.size} đã chọn
          </span>
          <button
            className="text-[var(--mute)]"
            onClick={exitSelectMode}
            type="button"
          >
            <X size={18} weight="bold" />
          </button>
        </div>
      ) : null}

      {group && !selectMode ? (
        <Button className="w-full mb-3" onClick={onOpenCreateCounter} size="sm" type="button">
          <Plus size={14} weight="bold" />
          Thêm bộ đếm
        </Button>
      ) : null}
      {!group && !selectMode ? (
        <p className="rounded-[10px] border border-[var(--hairline)] bg-[var(--surface-card)] p-4 text-sm text-[var(--mute)]">
          Tạo nhóm đầu tiên để bắt đầu đếm.
        </p>
      ) : null}

      {viewMode === "grid" ? (
        <div className={`grid gap-2 ${COL_CLASS[gridCols]}`}>
          {rootCounters.map((counter) => renderCounter(counter))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {rootCounters.map((counter) => renderCounter(counter))}
        </div>
      )}

      {selectMode && selectedIds.size > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center bg-[var(--canvas)] px-5 pb-5 pt-3">
          <div className="flex w-full max-w-lg gap-3">
            <Button
              className="flex-1 h-14 text-base"
              onClick={() => batchChange(-1)}
              size="lg"
              type="button"
              variant="muted"
            >
              <Minus size={22} weight="bold" />
              Giảm {selectedIds.size}
            </Button>
            <Button
              className="flex-1 h-14 text-base"
              onClick={() => batchChange(1)}
              size="lg"
              type="button"
            >
              <Plus size={22} weight="bold" />
              Tăng {selectedIds.size}
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
