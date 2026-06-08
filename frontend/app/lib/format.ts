export function formatTime(value: string): string {
  const iso = value.endsWith("Z") || value.includes("+") ? value : value + "Z";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(iso));
}

export function actionLabel(action: string): string {
  const labels: Record<string, string> = {
    group_created: "Tạo nhóm",
    group_renamed: "Đổi tên nhóm",
    group_deleted: "Xóa nhóm",
    counter_created: "Tạo bộ đếm",
    counter_renamed: "Đổi tên bộ đếm",
    counter_deleted: "Xóa bộ đếm",
    counter_reset: "Reset bộ đếm",
    counter_incremented: "Tăng số",
    counter_decremented: "Giảm số",
  };
  return labels[action] ?? action;
}
