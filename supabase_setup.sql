-- 创建 tasks 表
CREATE TABLE IF NOT EXISTS tasks (
    id BIGINT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium',
    alarm_time TEXT,
    alarm_enabled BOOLEAN DEFAULT FALSE,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notified_today BOOLEAN DEFAULT FALSE,
    user_id TEXT
);

-- 开启行级安全策略 (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许所有用户查看和修改所有任务 (共享模式)
-- 注意：如果您希望实现私有任务，需要修改这里的策略
CREATE POLICY "Allow all access for public shared mode" ON tasks
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 开启 Realtime 功能 (Supabase 需要显式开启)
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE tasks;
COMMIT;
