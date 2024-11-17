import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

// 在类定义中添加一个接口
interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
    fullResponse?: boolean;
}

class HttpUtils {
    // 基础请求配置
    private static baseConfig: AxiosRequestConfig = {
        timeout: 10000,
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
        },
        proxy: false
    };

    /**
     * GET 请求
     * @param url 请求地址
     * @param config 额外配置
     */
    static async get<T>(url: string, config: ExtendedAxiosRequestConfig = {}): Promise<T | AxiosResponse<T>> {
        try {
            const finalConfig = { ...this.baseConfig, ...config };
            const response: AxiosResponse<T> = await axios.get(url, finalConfig);
            return config.fullResponse ? response : response.data;
        } catch (error: any) {
            console.error('GET request failed:', error.message);
            throw error;
        }
    }

    /**
     * POST 请求
     * @param url 请求地址
     * @param data 请求数据
     * @param config 额外配置
     */
    static async post<T>(url: string, data?: any, config: ExtendedAxiosRequestConfig = {}): Promise<T | AxiosResponse<T>> {
        try {
            const response: AxiosResponse<T> = await axios.post(
                url,
                data,
                { ...this.baseConfig, ...config }
            );
            return config.fullResponse ? response : response.data;
        } catch (error) {
            console.error('POST request failed:', error);
            throw error;
        }
    }

    /**
     * 发送带 base64 解码的请求
     * @param url 请求地址
     * @param config 额外配置
     */
    static async getWithBase64Decode<T>(url: string, config: AxiosRequestConfig = {}): Promise<T> {
        try {
            const response = await this.get<string>(url, { ...config, fullResponse: false });
            const decodedData = Buffer.from(response as string, 'base64').toString('utf-8');
            return JSON.parse(decodedData);
        } catch (error) {
            console.error('Base64 decode request failed:', error);
            throw error;
        }
    }

    /**
     * 下载文件
     * @param url 文件地址
     * @param config 额外配置
     */
    static async downloadFile(url: string, config: AxiosRequestConfig = {}): Promise<Buffer> {
        try {
            const response = await axios.get(url, {
                ...this.baseConfig,
                ...config,
                responseType: 'arraybuffer'
            });
            return Buffer.from(response.data);
        } catch (error) {
            console.error('File download failed:', error);
            throw error;
        }
    }
}

export default HttpUtils; 