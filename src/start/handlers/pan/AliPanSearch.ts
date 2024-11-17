import { BaseHandler } from '../BaseHandler';
import { Command } from '../../decorators/command';
import { searchApi } from './SearchConfig';

@Command("资源搜")
export class AliPanSearch extends BaseHandler {
    private static searchCache: Map<number, any[]> = new Map();

    async handle(args: string[], userId?: number, groupId?: number): Promise<string> {
        if (args.length <= 0 || !args[0]) {
            return "请输入要搜索的资源";
        }
        let uId = groupId || 0;

        // 如果是数字，说明是在选择之前搜索的结果
        if (/^\d+$/.test(args[0])) {
            const cachedResults = AliPanSearch.searchCache.get(uId);
            if (!cachedResults) {
                return "❌ 请先搜索资源";
            }
            const index = parseInt(args[0]) - 1;
            if (index < 0 || index >= cachedResults.length) {
                return "❌ 序号无效";
            }
            const detail = await searchApi.getDetail({
                title: cachedResults[index].title,
                link: cachedResults[index].link
            });
            if (detail.length > 0) {
                return `📑 标题：${detail[0].title}\n🔗 链接：${detail[0].link}`;
            } else {
                return "❌ 未找到详细链接";
            }
        }

        const searchResult = await searchApi.search({
            keyword: args[0],
            page: 1,
            s_type: 2,
            from: 1
        });
        
        const sourceName = searchApi.getSourceName();
        let resultStr = `🔍 ${sourceName}搜索结果：\n\n`;

        // 缓存搜索结果
        AliPanSearch.searchCache.set(uId, searchResult);

        // upso直接显示链接，其他显示序号列表
        if (sourceName.toLowerCase().includes('upso')) {
            for (const item of searchResult) {
                resultStr += `📑 标题：${item.title}\n`;
                resultStr += `🔗 链接：${item.link}\n`;
                resultStr += `━━━━━━━━━━━━━━━━━━\n\n`;
            }
        } else {
            searchResult.forEach((item, index) => {
                resultStr += `${index + 1}、${item.title}\n`;
            });
            resultStr += '\n💡 请回复序号查看详细链接';
        }
        
        if (searchResult.length === 0) {
            return '❌ 未找到相关资源';
        }
        return resultStr;
    }
} 