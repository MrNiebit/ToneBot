import { ICommandHandler } from '../interfaces/ICommandHandler';

export class HandlerFactory {
    public static handlers: Map<string, new () => ICommandHandler> = new Map();

    static register(name: string, handler: new () => ICommandHandler): void {
        HandlerFactory.handlers.set(name, handler);
    }

    static createHandler(name: string): ICommandHandler | null {
        const Handler = HandlerFactory.handlers.get(name);
        return Handler ? new Handler() : null;
    }

    static getAllHandlers(): ICommandHandler[] {
        return Array.from(HandlerFactory.handlers.values()).map(Handler => new Handler());
    }
} 