/**
 * 获取Minecraft服务器状态
 */

import { Command } from "../decorators/command";
import { BaseHandler } from "./BaseHandler";
import { McUtils, McServerInfo } from "../utils/McUtils";

@Command("mc状态")
export class MineCraftServerStatusHandler extends BaseHandler {
    async handle(args: string[]): Promise<string> {
        if (args.length <= 0 || !args[0]) {
            return "服务器地址不能为空";
        }
        const serverInfo = await McUtils.getInfoByHost(args[0]);
        if (!serverInfo) {
            return "服务器连接失败";
        }
        let response = `🌐 服务器状态 | ${serverInfo.ip}:${serverInfo.port}\n` +
               `━━━━━━━━━━━━━━━━━━━━━━\n` +
               `📌 版本信息：${serverInfo.versionName}\n` +
               `🔧 协议版本：${serverInfo.versionProtocol}\n` +
               `👥 在线人数：${serverInfo.onlinePlayers}/${serverInfo.maxPlayers}\n`;

        if (serverInfo.playerList.length > 0) {
            response += `\n📋 在线玩家列表：\n`;
            serverInfo.playerList.forEach(player => {
                response += `👤 ${player}\n`;
            });
        }

        response += `━━━━━━━━━━━━━━━━━━━━━━`;
        return response;
    }
}