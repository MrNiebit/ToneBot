import { readdirSync } from 'fs';
import { join } from 'path';

export class HandlerLoader {
    static async load() {
        try {
            // 获取 handlers 目录的绝对路径
            const handlersPath = join(__dirname, '../handlers');
            console.log("handlersPath: ", handlersPath);
            
            // 读取目录下的所有文件
            const files = readdirSync(handlersPath);
            
            // 动态导入所有 handler 文件
            for (const file of files) {
                if (file.endsWith('.ts') || file.endsWith('.js')) {
                    // 跳过基础类和索引文件
                    if (file !== 'BaseHandler.ts' && file !== 'index.ts') {
                        // console.log(`Loading handler: ${file}`);
                        await import(join(handlersPath, file));
                    }
                }
            }
            
            console.log('All handlers loaded successfully');
        } catch (error) {
            console.error('Error loading handlers:', error);
        }
    }
} 