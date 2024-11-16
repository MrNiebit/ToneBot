import { ICommandHandler } from '../interfaces/ICommandHandler';


export abstract class BaseHandler implements ICommandHandler {

    abstract handle(args: string[]): Promise<string>;
} 