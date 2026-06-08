import { PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import type { Group } from "@/app/lib/types";
import { Button } from "@/app/components/ui/button";

type Props = {
  actorName: string;
  groups: Group[];
  selectedGroupId: string | null;
  isAdmin: boolean;
  onSelectGroup: (groupId: string) => void;
  onOpenCreateGroup: () => void;
  onOpenRenameGroup: () => void;
  onOpenDeleteGroup: () => void;
};

export function GroupBar({
  groups,
  selectedGroupId,
  isAdmin,
  onSelectGroup,
  onOpenCreateGroup,
  onOpenRenameGroup,
  onOpenDeleteGroup,
}: Props) {
  return (
    <section className="border-b border-[var(--hairline)] px-5 py-2">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1.5 overflow-x-auto scrollbar-none">
          {groups.map((group) => (
            <button
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition active:scale-95 ${
                group.id === selectedGroupId
                  ? "border-[var(--surface-dark)] bg-[var(--surface-dark)] text-[var(--on-dark)]"
                  : "border-[var(--hairline)] bg-[var(--surface-card)] text-[var(--ink)]"
              }`}
              key={group.id}
              onClick={() => onSelectGroup(group.id)}
              type="button"
            >
              {group.name}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            className="rounded-full p-1.5 text-[var(--mute)] transition hover:bg-[var(--surface-bone)] hover:text-[var(--ink)]"
            onClick={onOpenCreateGroup}
            type="button"
          >
            <Plus size={14} weight="bold" />
          </button>
          {selectedGroupId && isAdmin ? (
            <>
              <button
                className="rounded-full p-1.5 text-[var(--mute)] transition hover:bg-[var(--surface-bone)] hover:text-[var(--ink)]"
                onClick={onOpenRenameGroup}
                type="button"
              >
                <PencilSimple size={14} weight="bold" />
              </button>
              <button
                className="rounded-full p-1.5 text-[var(--mute)] transition hover:bg-red-50 hover:text-red-600"
                onClick={onOpenDeleteGroup}
                type="button"
              >
                <Trash size={14} weight="bold" />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
