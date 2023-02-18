import TelegramApi from 'node-telegram-bot-api';
import NodeCache from 'node-cache';
import {config} from 'dotenv';
import {Client} from '@notionhq/client';

config();

const telegramToken = process.env.TELEGRAM_API_TOKEN;
const bot = new TelegramApi(telegramToken, {polling: true});

const cache = new NodeCache({stdTTL: 1000});

const notionToken = process.env.NOTION_API_TOKEN
const notionBotTag = process.env.NOTION_BOT_TAG
const notionClient = new Client({auth: notionToken})

const NOTION_STORIES_KEYS = {
    NotionTask: 'notiontask',
    NotionBook: 'notionbook',
    NotionTV: 'notiontv',
};

const notionTypes = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{text: 'Task', callback_data: NOTION_STORIES_KEYS.NotionTask}],
            [{text: 'Book', callback_data: NOTION_STORIES_KEYS.NotionBook}],
            [{text: 'TV', callback_data: NOTION_STORIES_KEYS.NotionTV}],
        ]
    })
};

const NOTION_DATABASES = {
    [NOTION_STORIES_KEYS.NotionTask]: process.env.NOTION_PLANER_DATABASE_ID,
    [NOTION_STORIES_KEYS.NotionBook]: process.env.NOTION_BOOKS_DATABASE_ID,
    [NOTION_STORIES_KEYS.NotionTV]: process.env.NOTION_TV_DATABASE_ID,
};

/**
 * Работа с хранилищем данных
 */
// TODO: Сделать синглтоном
class Storage {

    has(key) {
        return !!cache.has(key);
    }

    get(key) {
        const value = cache.get(key);
        return value
            ? Storage.deserialize(cache.get(key))
            : null;
    }

    set(key, value) {
        cache.set(key, Storage.serialize(value));
    }

    clear(key) {
        cache.del(key);
    }

    static serialize(value) {
        return JSON.stringify(value);
    }

    static deserialize(value) {
        return JSON.parse(value);
    }
}

const storage = new Storage();

/**
 * Работа со сценариями
 */
class Story {
    currentStep = 0;
    steps = null;

    constructor(steps) {
        this.steps = steps
    }

    setStep(stepNumber) {
        this.currentStep = stepNumber;
    }

    getMessage() {
        if (this.currentStep < 0) {
            return 'Game OVER!';
        }
        return this.steps[this.currentStep][0];
    }

    saveAnswer(state) {
        return this.steps[this.currentStep][1](state);
    }
}

const createTasksNotionPageStory = [
    ['Введите заголовок', async (state) => {
        return 1;
    }],
    ['Создание заметки', async (state) => {
        return addNotionPage(NOTION_DATABASES[state.storyKey], state.text)
            .then(() => {
                bot.sendMessage(state.chatId, `Заметка создана успешно!`);
                return -1;
            })
            .catch(() => {
                bot.sendMessage(state.chatId, `При создании заметки произошла ошибка!`);
                return state.stepNumber;
            });
    }],
];

const createBookNotionPageStory = [
    ['Введите заголовок', async (state) => {
        return 1;
    }],
    ['Создание заметки', async (state) => {
        return addNotionPage(NOTION_DATABASES[state.storyKey], state.text)
            .then(() => -1)
            .catch(() => state.stepNumber);
    }],
];

const createTVNotionPageStory = [
    ['Введите заголовок', async (state) => {
        return 1;
    }],
    ['Создание заметки', async (state) => {
        return addNotionPage(NOTION_DATABASES[state.storyKey], state.text)
            .then(() => -1)
            .catch(() => state.stepNumber);
    }],
];

const STORIES = {
    [NOTION_STORIES_KEYS.NotionTask]: createTasksNotionPageStory,
    [NOTION_STORIES_KEYS.NotionBook]: createBookNotionPageStory,
    [NOTION_STORIES_KEYS.NotionTV]: createTVNotionPageStory,
}

bot.setMyCommands([
    {command: '/start', description: 'Начать работу с ботом'},
    {command: '/notion', description: 'Сделать заметку'},
    {command: '/info', description: 'Получить справку по работе с ботом'},
    {command: '/test', description: 'Испытание нового функционала'},
])

bot.on('message', async message => {
    const text = message.text;
    const chatId = message.chat.id;
    switch (text) {
        case '/start':
            return startCommandHandler(chatId);
            break;
        case '/notion':
            return notionCommandHandler(chatId);
            break;
        case '/info':
            return infoCommandHandler(chatId);
            break;
        default:
            return defaultCommandHandler(chatId, text);
            break;
    }
})

bot.on('callback_query', async msg => {
    const chatId = msg.message.chat.id;
    const restoredState = await storage.get(chatId);
    const newState = {...restoredState, chatId, storyKey: msg.data};
    await storage.set(chatId, newState);
    return storyStep(chatId, newState);
})

// Handlers
async function startCommandHandler(chatId) {
    return bot.sendMessage(chatId, `Добро пожаловать!`);
}

async function notionCommandHandler(chatId) {
    storage.set(chatId, {type: 'story'});
    return bot.sendMessage(chatId, `Выберите базу данных`, notionTypes)
}

async function infoCommandHandler(chatId) {
    return bot.sendMessage(chatId, `Справка по боту`);
}

async function defaultCommandHandler(chatId, text) {
    const isCommand = text.match(/^\//);
    if (isCommand) {
        return bot.sendMessage(chatId, `Неопознанная команда! Введите /info для справки.`);
    }
    const restoredState = storage.get(chatId);
    const newState = {...restoredState, chatId, text}
    await storyStep(chatId, newState);
}

async function storyStep(chatId, state) {
    if (state && state.type === 'story') {
        const {storyKey, stepNumber} = state;

        let story = new Story(STORIES[storyKey]);

        if (stepNumber) {
            story.setStep(stepNumber);
        }

        if (story.currentStep >= 0) {
            const stepNumber = await story.saveAnswer(state);
            storage.set(chatId, {...state, stepNumber});
        } else {
            storage.clear(chatId);
        }

        return bot.sendMessage(chatId, story.getMessage());
    }
}

// Notion API
async function addNotionPage(databaseId, title) {
    try {
        const response = await notionClient.pages.create({
            parent: {database_id: databaseId},
            properties: {
                title: {
                    title: [
                        {
                            "text": {
                                "content": title
                            }
                        }
                    ]
                },
                Tags: {
                    multi_select: [
                        {name: notionBotTag}
                    ]
                }
            },
        })
        console.log(response)
        console.log("Success! Entry added.")
    } catch (error) {
        console.error('Error: ', error.body);
    }
}