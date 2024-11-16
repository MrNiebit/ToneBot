class CommonUtils {
    /**
     * 延时函数
     * @param ms 延时毫秒数
     */
    static sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 格式化日期
     * @param date 日期对象
     * @param format 格式字符串
     */
    static formatDate(date: Date, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return format
            .replace('YYYY', String(year))
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    }

    /**
     * 生成随机字符串
     * @param length 字符串长度
     */
    static randomString(length: number): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * 深拷贝对象
     * @param obj 要拷贝的对象
     */
    static deepClone<T>(obj: T): T {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (obj instanceof Date) {
            return new Date(obj.getTime()) as any;
        }

        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item)) as any;
        }

        if (obj instanceof Object) {
            const copy = {} as T;
            Object.keys(obj).forEach(key => {
                copy[key as keyof T] = this.deepClone(obj[key as keyof T]);
            });
            return copy;
        }

        return obj;
    }

    /**
     * 防抖函数
     * @param func 要执行的函数
     * @param wait 等待时间
     */
    static debounce<T extends (...args: any[]) => any>(
        func: T,
        wait: number
    ): (...args: Parameters<T>) => void {
        let timeout: NodeJS.Timeout | null = null;
        return function(this: ThisParameterType<T>, ...args: Parameters<T>) {
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(() => {
                func.apply(this, args);
            }, wait);
        };
    }

    /**
     * 节流函数
     * @param func 要执行的函数
     * @param limit 限制时间
     */
    static throttle<T extends (...args: any[]) => any>(
        func: T,
        limit: number
    ): (...args: Parameters<T>) => void {
        let inThrottle = false;
        return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    }

    /**
     * 检查是否为空值
     * @param value 要检查的值
     */
    static isEmpty(value: any): boolean {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim().length === 0;
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    }

    /**
     * 文件大小格式化
     * @param bytes 字节数
     */
    static formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    }
}

export default CommonUtils; 