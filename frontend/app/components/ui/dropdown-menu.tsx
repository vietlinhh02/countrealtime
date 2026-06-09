"use client";

import { useEffect, useRef, useState } from "react";

type MenuItem = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
};

type Props = {
  trigger: React.ReactNode;
  items: MenuItem[];
  align?: "left" | "right";
};

export function DropdownMenu({ trigger, items, align = "right" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <div onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}>
        {trigger}
      </div>
      {open ? (
        <div
          className={`absolute z-50 mt-1 min-w-[140px] rounded-lg border border-[var(--hairline)] bg-[var(--surface-card)] py-1 shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item, i) => (
            <button
              key={i}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium ${
                item.variant === "danger"
                  ? "text-red-600 hover:bg-red-50"
                  : "text-[var(--ink)] hover:bg-[var(--surface-bone)]"
              }`}
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              type="button"
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
