import * as net from 'net';
import * as dns from 'dns';
import { promisify } from 'util';

interface McServerInfo {
    ip: string;
    port: number;
    maxPlayers: number;
    onlinePlayers: number;
    versionName: string;
    versionProtocol: number;
    playerList: string[];
}

class McUtils {
    static async getInfoByHost(host: string): Promise<McServerInfo | null> {
        try {
            let port = 25565;
            let finalHost = host;
            if (host.includes(":")) {
                const split = host.split(":");
                if (split.length === 2) {
                    port = parseInt(split[1]);
                    finalHost = split[0];
                }
            }
            return await McUtils.getInfoByIp(finalHost, port);
        } catch (e) {
            console.error(e);
        }
        return null;
    }

    static async getInfoByIp(ip: string, port: number): Promise<McServerInfo> {
        const jsonObject = await McUtils.getJsonObject(ip, port);

        const players = jsonObject.players;
        const version = jsonObject.version;

        const mcServerInfo: McServerInfo = {
            ip,
            port,
            maxPlayers: players.max,
            onlinePlayers: players.online,
            versionName: version.name,
            versionProtocol: version.protocol,
            playerList: []
        };

        const sample = players.sample;
        if (sample && sample.length > 0) {
            mcServerInfo.playerList = sample.map((player: any) => player.name);
        }

        return mcServerInfo;
    }

    static int2varint(input: number): Buffer {
        const out: number[] = [];
        while (true) {
            if ((input & ~0x7F) === 0) {
                out.push(input);
                break;
            }

            out.push((input & 0x7F) | 0x80);
            input >>>= 7;
        }
        return Buffer.from(out);
    }

    static getJsonObject(ip: string, port: number): Promise<any> {
        const bOut: number[] = [];

        // Construct request protocol
        bOut.push(0x00);
        bOut.push(...Array.from(McUtils.int2varint(755)));
        bOut.push(...Array.from(McUtils.int2varint(ip.length)));
        bOut.push(...Array.from(Buffer.from(ip)));
        bOut.push((port >> 8) & 0xFF, port & 0xFF);
        bOut.push(...Array.from(McUtils.int2varint(0x01)));

        return new Promise<any>((resolve, reject) => {
            const socket = new net.Socket();
            socket.setTimeout(10000);
            
            socket.connect({ host: ip, port }, () => {
                const sOut = Buffer.from(bOut);
                socket.write(Buffer.concat([McUtils.int2varint(sOut.length), sOut, Buffer.from([0x01, 0x00])]));
            });

            let buffer = Buffer.alloc(0);
            socket.on('data', (data: Buffer) => {
                try {
                    buffer = Buffer.concat([buffer, data]);
                    
                    // Skip packet length
                    let offset = 0;
                    while ((buffer[offset] & 0x80) !== 0) offset++;
                    offset++;
                    
                    // Skip packet ID
                    while ((buffer[offset] & 0x80) !== 0) offset++;
                    offset++;
                    
                    // Skip string length
                    while ((buffer[offset] & 0x80) !== 0) offset++;
                    offset++;
                    
                    // Read the actual JSON string
                    const jsonString = buffer.slice(offset).toString('utf8');
                    const jsonData = JSON.parse(jsonString);
                    resolve(jsonData);
                    socket.end();
                } catch (err) {
                    reject(err);
                }
            });

            socket.on('error', (err) => {
                reject(err);
            });

            socket.on('timeout', () => {
                socket.destroy();
                reject(new Error('Connection timeout'));
            });
        });
    }

    static readVarintFromStream(data: Buffer): number {
        let value = 0;
        let length = 0;
        let currentByte;
        let offset = 0;

        do {
            currentByte = data[offset++];
            value |= (currentByte & 0x7F) << (length * 7);
            length += 1;
            if (length > 5) {
                throw new Error("VarInt is too big");
            }
        } while ((currentByte & 0x80) === 0x80);

        return value;
    }
}

export { McUtils, McServerInfo };
