-- 强制修复数据库Schema，确保所有字段类型正确
-- 请在 Supabase SQL Editor 中运行此脚本

-- 1. 确保 tasks 表存在
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

-- 2. 检查并修正 user_id 列 (如果它是 UUID 类型，强制改为 TEXT)
-- 注意：如果该列不存在，Alter table 会失败，所以还是建议先看下表结构
-- 这里尝试变更类型，如果已经是TEXT则无影响
ALTER TABLE tasks ALTER COLUMN user_id TYPE TEXT;

-- 3. 检查并修正 alarm_time 列 (强制改为 TEXT)
ALTER TABLE tasks ALTER COLUMN alarm_time TYPE TEXT;

-- 4. 确保 RLS 策略存在
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Allow all access for public shared mode'
    ) THEN
        CREATE POLICY "Allow all access for public shared mode" ON tasks
            FOR ALL
            USING (true)
            WITH CHECK (true);
    END IF;
END
$$;

-- 5. 确保 Realtime 用于 tasks 表
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE tasks;
COMMIT;
