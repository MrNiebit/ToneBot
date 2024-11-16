import 'reflect-metadata';
import { HandlerFactory } from '../factories/HandlerFactory';

const COMMAND_KEY = 'command';
export function Command(command: string) {
    return function (target: any) {
        const commands = command.split(',').map(cmd => cmd.trim());
        Reflect.defineMetadata(COMMAND_KEY, commands, target.prototype);
        for (const cmd of commands) {
            console.log("register command: ", cmd);
            HandlerFactory.register(cmd, target);
        }
    }
}

export function getCommand(target: any) {
    return Reflect.getMetadata(COMMAND_KEY, target);
}
