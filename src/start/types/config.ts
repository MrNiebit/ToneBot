import PropertiesReader from 'properties-reader';
import path from 'path';
import fs from 'fs';

const CONFIG_PATH = path.join(process.cwd(), 'config.properties');

// 默认配置
const DEFAULT_CONFIG = `# OpenAI Configuration
openai.tokens=your-token-here
openai.host=https://api.moonshot.cn/v1
openai.model=moonshot-v1-8k

# Chat History Configuration
chat.historySize=20

# Prompt Templates
prompts.default=You are a helpful assistant.
prompts.群成员=你是一个微信聊天群里的群成员，你的名字叫"ovo"。你需要自行挑选某句话进行回复，不要每个对话都进行回复。你应当像一个人类一样参与进人类的聊天活动当中，对日常话题如工作、生活、娱乐等发表简短的见解，偶尔发送表情符号或简短问候语，让互动显得更真实。
prompts.猫娘=你需要扮演一只猫娘，后面的所有对话你都需要以猫娘的角色进行回答，如果你理解了你的角色设定，回复"喵~"
`;

// 创建一个函数来加载配置
function loadConfig(): typeof config {
    const properties = PropertiesReader(CONFIG_PATH);
    return {
        openai: {
            tokens: properties.get('openai.tokens')?.toString().split(',') || [],
            host: properties.get('openai.host')?.toString() || 'https://api.moonshot.cn/v1',
            model: properties.get('openai.model')?.toString() || 'moonshot-v1-8k'
        },
        prompts: {
            default: properties.get('prompts.default')?.toString() || 'You are a helpful assistant.',
            群成员: properties.get('prompts.群成员')?.toString() || '你是一个微信聊天群里的群成员，你的名字叫"ovo"。你需要自行挑选某句话进行回复，不要每个对话都进行回复。你应当像一个人类一样参与进人类的聊天活动当中，对日常话题如工作、生活、娱乐等发表简短的见解，偶尔发送表情符号或简短问候语，让互动显得更真实。',
            猫娘: properties.get('prompts.猫娘')?.toString() || '你需要扮演一只猫娘，后面的所有对话你都需要以猫娘的角色进行回答，如果你理解了你的角色设定，回复"喵~"'
        },
        chat: {
            historySize: properties.get('chat.historySize')?.toString() || '20'
        }
    };
}

// 检查配置文件是否存在，不存在则创建
if (!fs.existsSync(CONFIG_PATH)) {
    fs.writeFileSync(CONFIG_PATH, DEFAULT_CONFIG, 'utf8');
    console.log('Created default config.properties file');
}

// 导出配置对象
export let config: AIConfig = loadConfig();

let reloadTimeout: NodeJS.Timeout | null = null;

// 监听配置文件变化
fs.watch(CONFIG_PATH, (eventType) => {
    if (eventType === 'change') {
        if (reloadTimeout) {
            clearTimeout(reloadTimeout);
        }
        
        reloadTimeout = setTimeout(() => {
            try {
                config = loadConfig();
                console.log('Configuration reloaded successfully');
            } catch (error) {
                console.error('Error reloading configuration:', error);
            }
        }, 300);
    }
});

export interface PromptsConfig {
    default: string;
    [key: string]: string;
}

export interface OpenAIConfig {
    tokens: string[];
    host: string;
    model: string;
}

export interface AIConfig {
    openai: OpenAIConfig;
    prompts: PromptsConfig;
    chat: {
        historySize: string;
    }
} 