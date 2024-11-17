import { BaseHandler } from './BaseHandler';
import { Command } from '../decorators/command';
import { AIChatHandler } from './AIChatHandler';

@Command("清除对话,重置对话")
export class AIClearHandler extends BaseHandler {
    constructor(message: any) {
        super(message);
    }

    async handle(args: string[], userId?: number, groupId?: number): Promise<string> {
        if (!groupId) {
            groupId = 0;
        }
        AIChatHandler.clearHistory(groupId);
        return "已清除对话历史";
    }
} 