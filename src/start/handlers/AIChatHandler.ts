import { BaseHandler } from './BaseHandler';
import { Command } from '../decorators/command';
import OpenAI from 'openai';
import { config } from '../types/config';

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface ChatContext {
    messages: ChatMessage[];
    prompt: string;
    tokenIndex: number;
}

@Command("ai,chat,对话")
export class AIChatHandler extends BaseHandler {
    private static chatHistory: Map<number, ChatContext> = new Map();
    private static openaiInstances: OpenAI[] = [];
    
    constructor(message: any) {
        super(message);
        if (AIChatHandler.openaiInstances.length === 0) {
            this.initOpenAI();
        }
    }

    private initOpenAI(): void {
        // For each token create an instance
        config.openai.tokens.forEach(token => {
            AIChatHandler.openaiInstances.push(new OpenAI({
                apiKey: token,
                baseURL: config.openai.host
            }));
        });
    }

    private getOpenAIInstance(groupId: number): OpenAI {
        const context = this.getCurrentContext(groupId);
        return AIChatHandler.openaiInstances[context.tokenIndex];
    }

    private getCurrentContext(groupId: number): ChatContext {
        if (!AIChatHandler.chatHistory.has(groupId)) {
            AIChatHandler.chatHistory.set(groupId, {
                messages: [{
                    role: 'system',
                    content: config.prompts.default
                }],
                prompt: config.prompts.default,
                tokenIndex: 0
            });
        }
        return AIChatHandler.chatHistory.get(groupId)!;
    }

    async handle(args: string[], userId?: number, groupId?: number): Promise<string> {
        const userInput = args.join(' ').trim();
        if (!groupId) {
            groupId = 0;
        }

        // 检查是否是切换角色命令
        if (userInput.startsWith('切换') || userInput.startsWith('switch')) {
            return this.switchPrompt(userInput.split(/\s+/)[1], groupId);
        }

        // 检查是否有输入
        if (!userInput) {
            return "请输入要对话的内容";
        }

        const context = this.getCurrentContext(groupId);
        
        try {
            // 添加用户消息到历史
            context.messages.push({
                role: 'user',
                content: userInput
            });

            // 保持历史记录在合理范围内
            const maxHistory = parseInt(config.chat.historySize);
            if (context.messages.length > maxHistory + 1) {  // +1 是为了保留系统提示消息
                // 保留第一条系统消息，删除最旧的用户对话
                context.messages.splice(1, context.messages.length - maxHistory - 1);
            }

            // 轮询使用不同的 token
            const completion = await this.getOpenAIInstance(groupId).chat.completions.create({
                model: config.openai.model,
                messages: context.messages,
                temperature: 0.7,
                max_tokens: 1000,
            });

            // 轮换到下一个 token
            context.tokenIndex = (context.tokenIndex + 1) % AIChatHandler.openaiInstances.length;

            const reply = completion.choices[0]?.message?.content?.trim() || '抱歉，我现在无法回答。';

            // 添加助手回复到历史
            context.messages.push({
                role: 'assistant',
                content: reply
            });

            return reply;

        } catch (error: any) {
            console.error('OpenAI API error:', error);
            // 如果当前 token 失败，尝试切换到下一个
            context.tokenIndex = (context.tokenIndex + 1) % AIChatHandler.openaiInstances.length;
            return '抱歉，我遇到了一些问题，请稍后再试。';
        }
    }

    private switchPrompt(promptKey: string, groupId: number): string {
        const context = this.getCurrentContext(groupId);
        const newPrompt = config.prompts[promptKey as keyof typeof config.prompts];
        
        if (!newPrompt) {
            return `未找到角色 "${promptKey}"，可用角色：${Object.keys(config.prompts).join(', ')}`;
        }

        // 重置对话历史，使用新的 prompt
        context.messages = [{
            role: 'system',
            content: newPrompt
        }];
        context.prompt = newPrompt;

        return `已切换到 "${promptKey}" 角色`;
    }

    static clearHistory(userId: number): void {
        const context = AIChatHandler.chatHistory.get(userId);
        if (context) {
            context.messages = [{
                role: 'system',
                content: context.prompt
            }];
        }
    }
} 