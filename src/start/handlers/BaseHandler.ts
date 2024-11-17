import { ICommandHandler } from '../interfaces/ICommandHandler';


export abstract class BaseHandler implements ICommandHandler {
    protected message: any;

    constructor(message: any) {
        this.message = message;
    }

    protected getMessage() {
        return this.message;
    }

    abstract handle(args: string[]): Promise<string>;
} 