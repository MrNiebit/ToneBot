import { readdirSync } from 'fs';
import { join } from 'path';

export class HandlerLoader {
    static async load() {
        try {
            // 获取 handlers 目录的绝对路径
            const handlersPath = join(__dirname, '../handlers');
            console.log("handlersPath: ", handlersPath);
            
            // 递归扫描目录下的所有文件
            const scanDirectory = async (dirPath: string) => {
                const entries = readdirSync(dirPath, { withFileTypes: true });
                
                for (const entry of entries) {
                    const fullPath = join(dirPath, entry.name);
                    
                    if (entry.isDirectory()) {
                        // 递归扫描子目录
                        await scanDirectory(fullPath);
                    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
                        // 跳过基础类和索引文件
                        if (entry.name !== 'BaseHandler.ts' && entry.name !== 'index.ts') {
                            // console.log(`Loading handler: ${entry.name}`);
                            await import(fullPath);
                        }
                    }
                }
            };
            
            // 开始递归扫描
            await scanDirectory(handlersPath);
            
            console.log('All handlers loaded successfully');
        } catch (error) {
            console.error('Error loading handlers:', error);
        }
    }
} 