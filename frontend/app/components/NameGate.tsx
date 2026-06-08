"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Shield } from "@phosphor-icons/react";
import { Button } from "@/app/components/ui/button";
import { api } from "@/app/lib/api";

type Props = {
  onSubmit: (name: string, isAdmin: boolean) => void;
};

export function NameGate({ onSubmit }: Props) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName || loading) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (showAdmin && password.trim()) {
        const result = await api.login(password.trim());
        if (!result.is_admin) {
          setError("Sai mật khẩu admin");
          setLoading(false);
          return;
        }
        onSubmit(nextName, true);
      } else {
        onSubmit(nextName, false);
      }
    } catch {
      setError("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-dvh w-full flex-col bg-[var(--canvas)] px-5">
      <div className="flex flex-1 flex-col items-center justify-center">
        <h1 className="mx-auto max-w-[280px] text-center text-[36px] font-black leading-none -tracking-[0.8px]">
          Nhập tên để vào
        </h1>
        <p className="mt-3 text-center text-sm text-[var(--mute)]">
          Chọn tên hiển thị để bắt đầu đếm realtime cùng nhóm
        </p>
        <form className="mt-8 w-full max-w-[320px] space-y-3" onSubmit={submit}>
          <input
            className="h-12 w-full rounded-full border border-[var(--hairline)] bg-[var(--surface-card)] px-5 text-center text-base font-semibold text-[var(--ink)] outline-none placeholder:text-[var(--ash)]"
            maxLength={80}
            onChange={(event) => setName(event.target.value)}
            placeholder="Tên của bạn"
            value={name}
          />
          {showAdmin ? (
            <div className="relative">
              <input
                className="h-12 w-full rounded-full border border-[var(--hairline)] bg-[var(--surface-card)] px-5 text-center text-base font-semibold text-[var(--ink)] outline-none placeholder:text-[var(--ash)]"
                maxLength={80}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mật khẩu admin"
                type="password"
                value={password}
              />
            </div>
          ) : null}
          {error ? (
            <p className="text-center text-sm text-red-600">{error}</p>
          ) : null}
          <Button className="w-full" disabled={loading} size="lg" type="submit">
            {loading ? "Đang kiểm tra..." : "Vào app"}
            {!loading && <ArrowRight size={16} weight="bold" />}
          </Button>
          <button
            className="flex w-full items-center justify-center gap-1.5 py-2 text-xs font-medium text-[var(--mute)]"
            onClick={() => setShowAdmin(!showAdmin)}
            type="button"
          >
            <Shield size={14} weight="bold" />
            {showAdmin ? "Ẩn đăng nhập admin" : "Đăng nhập admin"}
          </button>
        </form>
      </div>
    </main>
  );
}
