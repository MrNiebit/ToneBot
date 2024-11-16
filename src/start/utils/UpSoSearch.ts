import HttpUtils from "./HttpUtils";

// 基础接口定义
interface ContentItem {
    title: string;
    geshi: string;
    size: string;
}

interface SearchItem {
    title: string;
    content: ContentItem[];
    page_url: string;
    id: string;
    path: string;
    available_time: string;
    insert_time: string;
}

interface SearchResponse {
    status: string;
    msg: string;
    result: {
        items: SearchItem[];
        page_url: string;
        id: string;
        path: string;
        available_time: string;
        insert_time: string;
        code?: string;
    };
    count: string;
}

interface SearchParams {
    keyword: string;
    page?: number;
    s_type?: number;
    from?: number;
    code?: string | number;
}

// 搜索策略接口
interface SearchStrategy {
    search(params: SearchParams): Promise<SearchResponse>;
    getName(): string;  // 获取搜索源名称
}

interface VerifyCodeResponse {
    status: string;
    msg: string;
    result: {
        code?: string;  // 验证码图片 URL
        code_url?: string;
    };
}

interface OcrResponse {
    result: string;  // 识别出的验证码
}

// 验证码管理器
class VerifyCodeManager {
    private static instance: VerifyCodeManager;
    private currentCode: string | null = null;
    private codeExpireTime: number | null = null;
    private readonly CODE_VALID_DURATION = 20 * 60 * 1000; // 验证码有效期20分钟

    private constructor() {}

    static getInstance(): VerifyCodeManager {
        if (!VerifyCodeManager.instance) {
            VerifyCodeManager.instance = new VerifyCodeManager();
        }
        return VerifyCodeManager.instance;
    }

    setCode(code: string): void {
        this.currentCode = code;
        this.codeExpireTime = Date.now() + this.CODE_VALID_DURATION;
    }

    getCode(): string | null {
        if (this.codeExpireTime && Date.now() > this.codeExpireTime) {
            this.currentCode = null;
            this.codeExpireTime = null;
        }
        return this.currentCode;
    }

    clearCode(): void {
        this.currentCode = null;
        this.codeExpireTime = null;
    }
}


// UpSo搜索实现
class UpSoSearchStrategy implements SearchStrategy {
    private readonly baseUrl = 'https://upapi.juapp9.com/search';
    private readonly ocrUrl = 'http://127.0.0.1:5000/ocr';

    private async recognizeVerifyCode(codeUrl: string): Promise<string> {
        try {
            const response = await HttpUtils.post<OcrResponse>(this.ocrUrl, {
                image_url: codeUrl
            });
            return response.result;
        } catch (error) {
            console.error('Verify code recognition failed:', error);
            throw error;
        }
    }

    async search(params: SearchParams): Promise<SearchResponse> {
        const url = new URL(this.baseUrl);
        
        // 添加已有验证码
        const existingCode = VerifyCodeManager.getInstance().getCode();
        if (existingCode && !params.code) {
            params.code = existingCode;
        }
        console.log(params);

        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
                url.searchParams.append(key, value.toString());
            }
        });

        try {
            const response = await HttpUtils.getWithBase64Decode<SearchResponse>(url.toString());
            
            if (response.status === 'failed' && response.result?.code) {
                // 获取新验证码并重试
                const newCode = await this.recognizeVerifyCode(response.result.code);
                console.log("获取新的验证码newCode: ", newCode);
                VerifyCodeManager.getInstance().setCode(newCode);
                return this.search({ ...params, code: newCode });
            }

            return response;
        } catch (error) {
            console.error('Search request failed:', error);
            throw error;
        }
    }

    getName(): string {
        return 'UpSo';
    }
}

// 搜索工厂类
class SearchFactory {
    private static instance: SearchFactory;
    private strategies: Map<string, SearchStrategy> = new Map();

    private constructor() {
        // 注册默认搜索策略
        this.registerStrategy('upso', new UpSoSearchStrategy());
    }

    static getInstance(): SearchFactory {
        if (!SearchFactory.instance) {
            SearchFactory.instance = new SearchFactory();
        }
        return SearchFactory.instance;
    }

    registerStrategy(name: string, strategy: SearchStrategy): void {
        this.strategies.set(name, strategy);
    }

    getStrategy(name: string): SearchStrategy {
        const strategy = this.strategies.get(name);
        if (!strategy) {
            throw new Error(`Search strategy ${name} not found`);
        }
        return strategy;
    }

    getDefaultStrategy(): SearchStrategy {
        return this.getStrategy('upso');
    }
}

// 添加搜索源枚举
export enum SearchSource {
    UPSO = 'upso',
    XIAO_ZHI_TIAO = 'xiaozhitiao',
    // 后续可以添加更多搜索源
    // ALIPAN = 'alipan',
    // BAIDU = 'baidu',
}

// 添加配置管理器
export class SearchConfig {
    private static instance: SearchConfig;
    private currentSource: SearchSource = SearchSource.UPSO;

    private constructor() {}

    static getInstance(): SearchConfig {
        if (!SearchConfig.instance) {
            SearchConfig.instance = new SearchConfig();
        }
        return SearchConfig.instance;
    }

    setCurrentSource(source: SearchSource): void {
        this.currentSource = source;
    }

    getCurrentSource(): SearchSource {
        return this.currentSource;
    }
}

// 修改搜索API
export const searchApi = {
    search: async (params: SearchParams, source?: SearchSource): Promise<SearchResponse> => {
        const factory = SearchFactory.getInstance();
        const actualSource = source || SearchConfig.getInstance().getCurrentSource();
        const strategy = factory.getStrategy(actualSource);
        return await strategy.search(params);
    },
    getSourceName: (source?: SearchSource): string => {
        const factory = SearchFactory.getInstance();
        const actualSource = source || SearchConfig.getInstance().getCurrentSource();
        const strategy = factory.getStrategy(actualSource);
        return strategy.getName();
    },
    // 添加切换源的便捷方法
    switchSource: (source: SearchSource): void => {
        SearchConfig.getInstance().setCurrentSource(source);
    },
    // 获取当前源
    getCurrentSource: (): SearchSource => {
        return SearchConfig.getInstance().getCurrentSource();
    }
}; 