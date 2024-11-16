import { EventHandler } from "../bot/EventHandler";
import { KeyBoard } from "../keyboard/keyboard";
import { MarkDown } from "../markdown/markdown";
import { createBotServer } from "../server/BotWsServer";
import { Msg } from "../util/Msg";
import { CenterMessageProcessor } from "../start/index";

import { HandlerLoader } from '../start/utils/HandlerLoader';

async function bootstrap() {
    // 加载所有 handlers
    await HandlerLoader.load();
    
    // 启动你的应用
    
    let port = 8082

    console.log("开始启动")
    const centerMessageProcessor = new CenterMessageProcessor();

    EventHandler.handleConnect = async (bot) => {
      console.log(`机器人已连接: ${bot.botId.toString()}`)
    }

    EventHandler.handleDisconnect = async (bot) => {
      console.log(`机器人已断开: ${bot.botId.toString()}`)
    }

    EventHandler.handlePrivateMessage = async (bot, event) => {
      let rawMsg = event?.raw_message
      let userId = event?.user_id
      if (userId != undefined && rawMsg != undefined) {
        console.log(`收到私聊消息，发送者: ${userId.toString()}，内容: ${rawMsg}`)
        let responseMsg = await centerMessageProcessor.handleMessage(rawMsg)
        if (responseMsg === undefined || responseMsg === "") {
          return
        }
        let msg = Msg.builder().text(responseMsg)
        await bot.sendPrivateMessage(userId, msg)
      }
    }

    EventHandler.handleGroupMessage = async (bot, event) => {
      var rawMsg = event?.raw_message
      let userId = event?.user_id
      let groupId = event?.group_id
      let message_id = event?.message_id
      var role: string

      console.log(event?.message_id)
      if (userId != undefined && groupId != undefined && rawMsg != undefined){
        console.log(`收到群聊消息，群号: ${groupId.toString()}，发送者: ${userId.toString()}，内容: ${rawMsg}`)
        let responseMsg = await centerMessageProcessor.handleMessage(rawMsg)
        console.log("responseMsg: ", responseMsg);
        if (responseMsg === undefined || responseMsg === "") {
          return
        }
        let msg = Msg.builder().text(responseMsg).at(userId)
        let a = await bot.sendGroupMessage(groupId, msg)
        if (a != null){
          let gm = await bot.getMsg(a.data.message_id)
          if (gm != null){
            console.log(JSON.stringify(gm))
          }
        }
        return
      }
    }



    createBotServer(port)

    console.log(`启动成功，端口：${port}`)
  }

bootstrap().catch(console.error);


function isAdmin (role: string) { 
    return role.toLowerCase() == "owner" || role.toLowerCase() == "admin"
}