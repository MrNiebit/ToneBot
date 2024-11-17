export interface SearchStrategy {
    search(params: SearchParams, retryCount?: number): Promise<SearchResponse[]>;
    getDetail(params: SearchDetailParams): Promise<SearchResponse[]>;
    getName(): string;
}

export interface SearchParams {

}

export interface SearchDetailParams {
    title: string;
    link: string;
}

export interface SearchResponse {
    title?: string;
    link?: string;
}

export interface SearchItem {
    size?: string;
    path?: string;
    id?: string;
    title: string;
    page_url: string;
    // Add other properties as needed based on your actual search item structure
}

// ... 其他接口定义 ... 