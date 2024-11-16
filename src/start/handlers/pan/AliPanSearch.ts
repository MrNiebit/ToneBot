import { BaseHandler } from '../BaseHandler';
import { Command } from '../../decorators/command';
import { searchApi, SearchSource } from '../../utils/UpSoSearch';
@Command("资源搜")
export class AliPanSearch extends BaseHandler {

    async handle(args: string[]): Promise<string> {
        if (args.length <= 0 || !args[0]) {
            return "请输入要搜索的资源";
        }
        const searchResult = await searchApi.search({
            keyword: args[0],
            page: 1,
            s_type: 2,
            from: 1
        });
        // console.log(searchResult);
        
        const sourceName = searchApi.getSourceName();
        let resultStr = `🔍 ${sourceName}搜索结果：\n\n`;
        const items = searchResult.result.items;
        // console.log(items);
        for (const item of items) {
            if (item.id === '-1') {
                continue;
            }
            resultStr += `📑 标题：${item.title}\n`;
            resultStr += `🔗 链接：${item.page_url}\n`;
            resultStr += `━━━━━━━━━━━━━━━━━━\n\n`;
        }
        
        if (!resultStr.includes('标题')) {
            return '❌ 未找到相关资源';
        }
        return resultStr;
    }
} 