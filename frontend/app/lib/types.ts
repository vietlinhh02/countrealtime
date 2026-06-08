export type Group = {
  id: string;
  name: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  counter_count: number;
};

export type Counter = {
  id: string;
  group_id: string;
  parent_id: string | null;
  name: string;
  value: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
};

export type CounterLog = {
  id: string;
  group_id: string;
  counter_id: string | null;
  actor_name: string;
  action: string;
  old_value: number | null;
  new_value: number | null;
  delta: number | null;
  message: string;
  created_at: string;
};

export type GroupDetail = {
  group: Group;
  counters: Counter[];
  logs: CounterLog[];
};

export type RealtimeEvent = {
  type: string;
  group?: Group;
  counter?: Counter;
  log?: CounterLog;
  group_id?: string;
  counter_id?: string;
};
