import { SearchSource } from '../../types/SearchTypes';
import { SearchFactory } from './SearchFactory';
import { SearchParams, SearchResponse, SearchDetailParams } from './strategies/SearchStrategy'; 

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

export const searchApi = {
    search: async (params: SearchParams, source?: SearchSource): Promise<SearchResponse[]> => {
        const factory = SearchFactory.getInstance();
        const actualSource = source || SearchConfig.getInstance().getCurrentSource();
        const strategy = factory.getStrategy(actualSource);
        return await strategy.search(params);
    },
    getDetail: async (params: SearchDetailParams, source?: SearchSource): Promise<SearchResponse[]> => {
        const factory = SearchFactory.getInstance();
        const actualSource = source || SearchConfig.getInstance().getCurrentSource();
        const strategy = factory.getStrategy(actualSource);
        return await strategy.getDetail(params);
    },
    getSourceName: (source?: SearchSource): string => {
        const factory = SearchFactory.getInstance();
        const actualSource = source || SearchConfig.getInstance().getCurrentSource();
        const strategy = factory.getStrategy(actualSource);
        return strategy.getName();
    },
    switchSource: (source: SearchSource): void => {
        SearchConfig.getInstance().setCurrentSource(source);
    },
    getCurrentSource: (): SearchSource => {
        return SearchConfig.getInstance().getCurrentSource();
    }
}; 