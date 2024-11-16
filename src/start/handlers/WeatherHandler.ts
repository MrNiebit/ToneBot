import { BaseHandler } from './BaseHandler';
import { Command } from '../decorators/command';

@Command("天气,weather")
export class WeatherHandler extends BaseHandler {

    async handle(args: string[]): Promise<string> {
        // 实现天气查询逻辑
        return '天气查询结果...';
    }
} 