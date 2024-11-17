import HttpUtils from "../../../utils/HttpUtils";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import * as crypto from "crypto";
import { JSDOM } from "jsdom";
import { SearchStrategy, SearchParams, SearchResponse, SearchItem, SearchDetailParams } from "./SearchStrategy";
import { SearchSource } from "../../../types/SearchTypes";

interface CatSoSearchRequest extends SearchParams {
    keyword: string;
}

interface CatSoSearchResponse extends SearchResponse {
    id: string;
}

export class CatSoSearchStrategy implements SearchStrategy {
    private static readonly HEADERS: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
    };

    private static readonly KEY = "1234567812345678";
    private static readonly IV = "1234567812345678";
    private static readonly HOME_URL = "https://www.alipansou.com";
    private static readonly SEARCH_URL = "https://www.alipansou.com/search?k=%s&s=2&t=-1";
    private static readonly ITEM_REGEX = /<van-row>\s*<a href="([^"]+)"[^>]*>[\s\S]*?<template #title>\s*<div[^>]*>([\s\S]*?)<\/div>/g;

    private static getStartLoadParam(htmlContent: string): string | null {
        const match = htmlContent.match(/start_load\("([a-fA-F0-9]+)"\)/);
        return match ? match[1] : null;
    }

    private static encryptToHex(value: string): string {
        const cipher = crypto.createCipheriv("aes-128-cbc", Buffer.from(this.KEY), Buffer.from(this.IV));
        const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
        return encrypted.toString("hex");
    }

    /**
     * 获取并设置 ck_ml_sea cookie
     * @param targetUrl 目标URL
     * @returns 加密后的cookie值
     */
    private static async getCkMlSeaCookie(targetUrl: string): Promise<string> {
        // 获取网页内容
        const config: AxiosRequestConfig = { headers: this.HEADERS };
        const response = await HttpUtils.get<string>(targetUrl, config);
        const responseData = typeof response === 'string' ? response : response.data;
        
        // 提取参数
        const param = this.getStartLoadParam(responseData);
        if (!param) {
            throw new Error("未能提取到start_load参数");
        }

        // AES加密
        return this.encryptToHex(param);
    }

    /**
     * 检查响应是否需要重新获取 ck_ml_sea，并在需要时处理
     * @param response 响应内容
     * @param url 当前请求的URL
     * @returns 处理后的响应内容
     */
    private static async handleResponse(response: string | any, url: string): Promise<string> {
        const responseData = typeof response === 'string' ? response : response.data;
        
        // 使用正则表达式检查是否匹配 start_load 格式
        const startLoadRegex = /start_load\("([a-fA-F0-9]+)"\)/;
        if (typeof responseData === 'string' && startLoadRegex.test(responseData)) {
            // 重新获取 ck_ml_sea
            console.log("重新获取 ck_ml_sea")
            const ckMlSea = await this.getCkMlSeaCookie(url);
            this.HEADERS["Cookie"] = `ck_ml_sea_=${ckMlSea}`;

            // 重新发送请求
            const newResponse = await HttpUtils.get<string>(url, { 
                headers: this.HEADERS 
            });
            return typeof newResponse === 'string' ? newResponse : newResponse.data;
        }

        return responseData;
    }

    public getName(): string {
        return SearchSource.CAT_SO;
    }

    public static async getRedirectUrl(targetUrl: string, retryCount: number = 2): Promise<string | null> {
        try {
            if (retryCount < 1) {
                return null;
            }
            // 设置 referer
            this.HEADERS["referer"] = targetUrl;

            // 获取并设置 ck_ml_sea cookie
            // const ckMlSea = await this.getCkMlSeaCookie(targetUrl);
            // this.HEADERS["Cookie"] = `ck_ml_sea_=${ckMlSea}`;

            // Step 3: 请求API
            const apiResponse = await HttpUtils.post<any>(
                "https://www.alipansou.com/active",
                new URLSearchParams({ code: "5678" }).toString(),
                {
                    headers: {
                        ...this.HEADERS,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    fullResponse: true
                }
            );

            // https://www.alipansou.com/s/UdQ3H9VE0fL34Bao8cuwCtbSXAvkz -> https://www.alipansou.com/cv/UdQ3H9VE0fL34Bao8cuwCtbSXAvkz 
            targetUrl = targetUrl.replace("https://www.alipansou.com/s", "https://www.alipansou.com/cv");

            // 如果响应需要重新获取cookie，则处理
            const startLoadRegex = /start_load\("([a-fA-F0-9]+)"\)/;
            if (typeof apiResponse.data === 'string' && startLoadRegex.test(apiResponse.data)) {
                const ckMlSea = await this.getCkMlSeaCookie(targetUrl);
                this.HEADERS["Cookie"] = `ck_ml_sea_=${ckMlSea}`;
                return await this.getRedirectUrl(targetUrl, retryCount - 1);
            }
            // console.log(apiResponse.headers);
            // 处理egg cookie
            const eggCookie = apiResponse.headers?.["set-cookie"]?.find(
                (cookie: string) => cookie.startsWith("_egg")
            );
            if (eggCookie) {
                this.HEADERS["Cookie"] += `;${eggCookie}`;
            }
            console.log(this.HEADERS);

            // Step 4: 最终请求
            const finalResponse = await HttpUtils.get<any>(targetUrl, {
                headers: this.HEADERS,
                maxRedirects: 0,
                validateStatus: (status) => status >= 200 && status < 400,
                fullResponse: true
            });

            // 检查是否需要重新获取 ck_ml_sea
            await this.handleResponse(finalResponse.data, targetUrl);

            return finalResponse.headers?.["location"] || null;

        } catch (error) {
            console.error("AlipanSou redirect error:", error);
            return null;
        }
    }

    public async search(params: CatSoSearchRequest): Promise<CatSoSearchResponse[]> {
        try {
            const searchUrl = CatSoSearchStrategy.SEARCH_URL.replace("%s", encodeURIComponent(params.keyword));
            const response = await HttpUtils.get<string>(
                searchUrl,
                { headers: CatSoSearchStrategy.HEADERS }
            );
            
            const responseData = await CatSoSearchStrategy.handleResponse(response, searchUrl);
            const items: CatSoSearchResponse[] = [];

            let match;
            while ((match = CatSoSearchStrategy.ITEM_REGEX.exec(responseData)) !== null) {
                const [_, href, title] = match;
                if (href && title) {
                    items.push({
                        title: title.replace(/<[^>]*>|[\s]+/g, ' ').trim(), // 移除HTML标签和多余空格
                        id: `${CatSoSearchStrategy.HOME_URL}${href}`,
                        link: `${CatSoSearchStrategy.HOME_URL}${href}`
                    });
                }
            }

            return items;
        } catch (error) {
            console.error("Search failed:", error);
            return [];
        }
    }

    public async getDetail(params: SearchDetailParams): Promise<SearchResponse[]> {
        CatSoSearchStrategy.HEADERS["referer"] = params.link;
        const redirectUrl = await CatSoSearchStrategy.getRedirectUrl(params.link) || "未获取到链接";
        return [
            {
                title: params.title,
                link: redirectUrl
            }
        ];
    }
}


