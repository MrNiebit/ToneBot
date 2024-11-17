import { BaseHandler } from '../BaseHandler';
import { Command } from '../../decorators/command';
import { searchApi } from './SearchConfig';
import { SearchSource } from '../../types/SearchTypes';

@Command("源切换")
export class SearchSourceManager extends BaseHandler {
    async handle(args: string[]): Promise<string> {
        // 如果没有参数，显示当前源和可用源列表
        if (args.length === 0) {
            return this.listSources();
        }

        // 如果有参数，尝试切换到指定源
        const sourceInput = args[0].toLowerCase();
        try {
            const source = this.parseSource(sourceInput);
            searchApi.switchSource(source);
            return `✅ 已切换到 ${searchApi.getSourceName()} 搜索源`;
        } catch (error) {
            return `❌ 无效的搜索源，可用源：\n${this.listSources()}`;
        }
    }

    private listSources(): string {
        const currentSource = searchApi.getCurrentSource();
        let result = `🔍 当前搜索源：${searchApi.getSourceName()}\n\n`;
        result += "📑 可用搜索源列表：\n";
        
        Object.values(SearchSource).forEach(source => {
            const marker = source === currentSource ? "✅" : "⭕️";
            result += `${marker} ${searchApi.getSourceName(source)}\n`;
        });
        
        result += "\n使用方法：源切换 <源名称> 进行切换";
        return result;
    }

    private parseSource(input: string): SearchSource {
        const sourcesMap: Record<string, SearchSource> = {
            'upso': SearchSource.UPSO,
            'catso': SearchSource.CAT_SO,
            // 可以在这里添加更多源的映射
        };

        const source = sourcesMap[input];
        if (!source) {
            throw new Error('Invalid source');
        }
        return source;
    }
} 