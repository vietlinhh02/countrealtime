import { Suspense } from "react";
import { LogsScreen } from "@/app/components/LogsScreen";

export default function LogsPage() {
  return (
    <Suspense fallback={null}>
      <LogsScreen />
    </Suspense>
  );
}
