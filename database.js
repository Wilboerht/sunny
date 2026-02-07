// Supabase配置文件
const SUPABASE_CONFIG = {
    url: 'https://rwiulfkdkbkztxfehuuz.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3aXVsZmtka2JrenR4ZmVodXV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNTU4MTYsImV4cCI6MjA4NTYzMTgxNn0.mvjgJ5hHPBv3RP8u78IsA3t_i3FM72G80LnNN1q0hMI'
};

// 数据库操作类
class TaskDatabase {
    constructor() {
        this.client = null;
        this.initialized = false;
    }

    // 初始化Supabase客户端
    async initialize() {
        if (this.initialized) return this.client;

        try {
            // 动态加载Supabase库
            if (!window.supabase) {
                console.log('正在加载Supabase库...');
                await this.loadSupabaseScript();
            }

            console.log('创建Supabase客户端...');
            this.client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
            this.initialized = true;
            console.log('Supabase客户端初始化成功');
            return this.client;
        } catch (error) {
            console.error('数据库初始化失败:', error);
            throw error;
        }
    }

    // 动态加载Supabase脚本
    loadSupabaseScript() {
        return new Promise((resolve, reject) => {
            if (window.supabase) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = () => {
                console.log('Supabase库加载完成');
                resolve();
            };
            script.onerror = (error) => {
                console.error('Supabase库加载失败:', error);
                reject(error);
            };
            document.head.appendChild(script);
        });
    }

    // 获取所有任务（或指定用户的任务）
    async getTasks(userId = null) {
        if (!this.initialized) await this.initialize();

        let query = this.client
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });

        // 如果指定了用户ID，只获取该用户的任务
        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('获取任务失败:', error);
            throw error;
        }

        console.log('获取到任务:', data.length, '个');
        return data.map(this.transformFromDB);
    }

    // 创建新任务
    async createTask(taskData) {
        if (!this.initialized) await this.initialize();

        const { data, error } = await this.client
            .from('tasks')
            .insert(this.transformToDB(taskData))
            .select()
            .single();

        if (error) {
            console.error('创建任务失败:', error);
            throw error;
        }

        return this.transformFromDB(data);
    }

    // 更新任务
    async updateTask(taskId, updates) {
        if (!this.initialized) await this.initialize();

        const { data, error } = await this.client
            .from('tasks')
            .update(this.transformToDB(updates))
            .eq('id', taskId)
            .select()
            .single();

        if (error) {
            console.error('更新任务失败:', error);
            throw error;
        }

        return this.transformFromDB(data);
    }

    // 删除任务
    async deleteTask(taskId) {
        if (!this.initialized) await this.initialize();

        console.log('Attempting to delete task ID:', taskId);

        const { error } = await this.client
            .from('tasks')
            .delete()
            .eq('id', taskId);

        if (error) {
            console.error('删除任务失败:', error);
            throw error;
        }

        return true;
    }

    // 监听任务变化（实时同步）
    subscribeToTaskChanges(callback) {
        if (!this.initialized) {
            throw new Error('数据库未初始化');
        }

        console.log('设置实时监听...');

        const channel = this.client
            .channel('tasks-changes')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tasks'
                },
                (payload) => {
                    console.log('收到实时数据变化:', payload);
                    // 确保回调函数中的this指向正确的实例
                    if (callback) {
                        callback.call(this, payload);
                    }
                }
            )
            .subscribe((status) => {
                console.log('实时监听订阅状态:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('实时监听订阅成功');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('实时监听订阅失败');
                }
            });

        return channel;
    }

    // 数据转换：从数据库格式转换到前端格式
    transformFromDB(dbTask) {
        return {
            id: dbTask.id,
            title: dbTask.title,
            description: dbTask.description || '',
            priority: dbTask.priority,
            alarmTime: dbTask.alarm_time || '',
            alarmEnabled: dbTask.alarm_enabled,
            completed: dbTask.completed,
            createdAt: dbTask.created_at,
            updatedAt: dbTask.updated_at,
            notifiedToday: dbTask.notified_today,
            userId: dbTask.user_id
        };
    }

    // 数据转换：从前端格式转换到数据库格式
    transformToDB(task) {
        return {
            id: task.id,
            title: task.title,
            description: task.description || '',
            priority: task.priority,
            alarm_time: task.alarmTime || null,
            alarm_enabled: Boolean(task.alarmEnabled),
            completed: Boolean(task.completed),
            created_at: task.createdAt || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            notified_today: Boolean(task.notifiedToday),
            user_id: task.userId || 'default_user'
        };
    }

    // 生成唯一任务ID
    generateId() {
        return Date.now() + Math.floor(Math.random() * 1000);
    }
}

// 导出数据库实例
window.taskDB = new TaskDatabase();