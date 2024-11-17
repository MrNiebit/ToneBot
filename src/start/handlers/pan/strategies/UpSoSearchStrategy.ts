import HttpUtils from "../../../utils/HttpUtils";
import { SearchStrategy, SearchParams, SearchResponse, SearchItem, SearchDetailParams } from './SearchStrategy';
import { SearchSource } from '../../../types/SearchTypes';

// 基础接口定义
interface ContentItem {
    title: string;
    geshi: string;
    size: string;
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

interface UpSoSearchRequest extends SearchParams {
    keyword: string;
    page?: number;
    s_type?: number;
    from?: number;
    code?: string | number;
}

interface UpSoSearchResponse extends SearchResponse {
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
export class UpSoSearchStrategy implements SearchStrategy {
    private readonly baseUrl = 'https://upapi.juapp9.com/search';
    private readonly ocrUrl = 'http://127.0.0.1:5000/ocr';

    private async recognizeVerifyCode(codeUrl: string): Promise<string> {
        try {
            const response = await HttpUtils.post<OcrResponse>(this.ocrUrl, {
                image_url: codeUrl
            });
            return 'data' in response ? response.data.result : response.result;
        } catch (error) {
            console.error('Verify code recognition failed:', error);
            throw error;
        }
    }

    async search(params: UpSoSearchRequest, retryCount = 2): Promise<SearchResponse[]> {
        if (retryCount < 1) {
            throw new Error("验证码识别失败, 无法获取搜索结果");
        }
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
            const response = await HttpUtils.getWithBase64Decode<UpSoSearchResponse>(url.toString());
            
            if (response.status === 'failed' && response.result?.code) {
                // 获取新验证码并重试
                const newCode = await this.recognizeVerifyCode(response.result.code);
                console.log("获取新的验证码newCode: ", newCode);
                VerifyCodeManager.getInstance().setCode(newCode);
                return this.search({ ...params, code: newCode }, retryCount - 1);
            }
            const searchResults = response.result.items
                                .filter(item => item.id !== '-1')
                                .map((item: SearchItem) => ({
                                    title: item.title,
                                    link: item.page_url
                                }));
            return searchResults;
        } catch (error) {
            console.error('Search request failed:', error);
            throw error;
        }
    }

    async getDetail(params: SearchDetailParams): Promise<SearchResponse[]> {
        return [];
    }

    getName(): string {
        return SearchSource.UPSO;
    }
}
