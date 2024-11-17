
import { HandlerFactory } from './factories/HandlerFactory';

export class CenterMessageProcessor {

    public async handleMessage(message: string, userId?: number, groupId?: number): Promise<string> {
        const parts = message.split(/\s+/);
        const command = parts[0];
        const args = parts.slice(1);

        let handler = HandlerFactory.createHandler(command);
        if (handler != null) {
            console.log("Command arguments:", args);
            return await handler.handle(args, userId, groupId);
        }
        return Promise.resolve("");
    }
}