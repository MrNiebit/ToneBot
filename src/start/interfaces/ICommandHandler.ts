export interface ICommandHandler {

    handle(args: string[]): Promise<string>;
} 