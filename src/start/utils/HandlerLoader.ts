import { readdirSync } from 'fs';
import { join } from 'path';

export class HandlerLoader {
    static async load() {
        try {
            // 判断当前环境
            const isDev = process.env.NODE_ENV === 'development';
            
            // 获取 handlers 目录的绝对路径
            const handlersPath = join(__dirname, '../handlers');
            console.log("handlersPath: ", handlersPath);

            if (!isDev) {
                // 开发环境下的递归扫描逻辑
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
                                await import(fullPath);
                            }
                        }
                    }
                };
                
                await scanDirectory(handlersPath);
            } else {
                // 生产环境下使用 require 加载模块
                // require("../handlers/HelpHandler");
                // require("../handlers/MineCraftServerStatusHandler");
                // require("../handlers/pan/AliPanSearch");

                await import("../handlers/HelpHandler");
                await import("../handlers/MineCraftServerStatusHandler");
                await import("../handlers/pan/AliPanSearch");
                await import("../handlers/pan/SearchSourceManager");
                await import("../handlers/AIChatHandler");
                await import("../handlers/AIClearHandler");
            }
            
            console.log('All handlers loaded successfully');
        } catch (error) {
            console.error('Error loading handlers:', error);
        }
    }
} 