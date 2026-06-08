"use client";

import { FormEvent, useState } from "react";
import { X } from "@phosphor-icons/react";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent } from "@/app/components/ui/dialog";

type Props = {
  buttonLabel: string;
  initialValue?: string;
  isOpen: boolean;
  placeholder: string;
  title: string;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
};

export function NameModal({
  buttonLabel,
  initialValue = "",
  isOpen,
  placeholder,
  title,
  onClose,
  onSubmit,
}: Props) {
  const [name, setName] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) {
    return null;
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName || isSaving) {
      return;
    }
    setIsSaving(true);
    try {
      await onSubmit(nextName);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog isOpen={isOpen}>
      <DialogContent>
        <form onSubmit={submit}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-black -tracking-[0.5px]">
              {title}
            </h2>
            <Button aria-label="Đóng" onClick={onClose} size="icon" type="button" variant="ghost">
              <X size={18} weight="bold" />
            </Button>
          </div>
          <input
            autoFocus
            className="h-12 w-full rounded-full border border-[var(--hairline)] bg-[var(--canvas)] px-5 text-base font-semibold text-[var(--ink)] outline-none placeholder:text-[var(--ash)]"
            maxLength={80}
            onChange={(event) => setName(event.target.value)}
            placeholder={placeholder}
            value={name}
          />
          <Button className="mt-3 w-full" disabled={isSaving} size="lg" type="submit">
            {buttonLabel}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
