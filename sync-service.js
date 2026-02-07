// 轮询同步服务 - 作为Realtime的后备方案
class SyncService {
    constructor(database, updateCallback) {
        this.db = database;
        this.onUpdate = updateCallback;
        this.pollingInterval = null;
        this.lastSyncTime = null;
        this.isPolling = false;
    }
    
    // 开始轮询同步
    startPolling(intervalMs = 3000) {
        if (this.isPolling) return;
        
        console.log('开始轮询同步，间隔:', intervalMs, 'ms');
        this.isPolling = true;
        
        // 立即执行一次
        this.pollForChanges();
        
        // 设置定时轮询
        this.pollingInterval = setInterval(() => {
            this.pollForChanges();
        }, intervalMs);
    }
    
    // 停止轮询同步
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        this.isPolling = false;
        console.log('轮询同步已停止');
    }
    
    // 轮询检查变化
    async pollForChanges() {
        try {
            if (!this.db.initialized) return;
            
            console.log('检查数据变化...');
            
            // 获取最新数据
            const currentTasks = await this.db.getTasks();
            
            // 检查是否有新数据或更新
            if (this.lastSyncTime) {
                const newTasks = currentTasks.filter(task => 
                    new Date(task.updatedAt) > this.lastSyncTime
                );
                
                if (newTasks.length > 0) {
                    console.log('发现', newTasks.length, '个更新:', newTasks);
                    if (this.onUpdate) {
                        this.onUpdate(newTasks, currentTasks);
                    }
                }
            } else {
                // 首次同步
                if (this.onUpdate) {
                    this.onUpdate([], currentTasks);
                }
            }
            
            this.lastSyncTime = new Date();
        } catch (error) {
            console.error('轮询同步失败:', error);
        }
    }
    
    // 手动触发同步
    async forceSync() {
        console.log('手动触发同步');
        this.lastSyncTime = null; // 重置时间戳，强制全量同步
        await this.pollForChanges();
    }
}

// 导出服务
window.SyncService = SyncService;