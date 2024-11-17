import { SearchStrategy } from './strategies/SearchStrategy';
import { UpSoSearchStrategy } from './strategies/UpSoSearchStrategy'
import { CatSoSearchStrategy } from './strategies/CatSoSearchStrategy';
import { SearchSource } from '../../types/SearchTypes';

export class SearchFactory {
    private static instance: SearchFactory;
    private strategies: Map<string, SearchStrategy> = new Map();

    private constructor() {
        this.registerStrategy(SearchSource.UPSO, new UpSoSearchStrategy());
        this.registerStrategy(SearchSource.CAT_SO, new CatSoSearchStrategy());
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
} 