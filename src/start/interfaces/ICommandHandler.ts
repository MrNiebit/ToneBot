export interface ICommandHandler {

    handle(args: string[], userId?: number, groupId?: number): Promise<string>;
} 