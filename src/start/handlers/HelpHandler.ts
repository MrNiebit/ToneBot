import { BaseHandler } from './BaseHandler';
import { Command } from '../decorators/command';
import { HandlerFactory } from '../factories/HandlerFactory';
import { ICommandHandler } from '../interfaces/ICommandHandler';

@Command("帮助,菜单,help")
export class HelpHandler extends BaseHandler {
    async handle(args: string[]): Promise<string> {
        // 从 HandlerFactory 获取所有已注册的命令
        const commands = Array.from(HandlerFactory.handlers.keys());
        
        // 创建一个Map来存储相同handler实例的所有命令
        const handlerToCommands = new Map<object, string[]>();
        
        // 遍历所有命令,按handler实例分组
        for (const cmd of commands) {
            const handler = HandlerFactory.handlers.get(cmd) as unknown as new () => ICommandHandler;
            if (!handlerToCommands.has(handler)) {
                handlerToCommands.set(handler, []);
            }
            handlerToCommands.get(handler)?.push(cmd);
        }
        // 构建帮助信息
        let helpText = '📋 命令菜单\n';
        helpText += '━━━━━━━━━━━━━━━━━━━━━━\n';
        
        for (const commandGroup of Array.from(handlerToCommands.values())) {
            // 跳过帮助命令组
            if (commandGroup.includes('帮助') || commandGroup.includes('菜单') || commandGroup.includes('help')) continue;
            helpText += `🔸 ${commandGroup.join('/')}\n`;
        }
        
        helpText += '━━━━━━━━━━━━━━━━━━━━━━\n';
        helpText += '💡 提示：输入任意命令即可使用\n';
        return helpText;
    }
}