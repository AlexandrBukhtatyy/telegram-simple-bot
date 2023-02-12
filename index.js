import TelegramApi from 'node-telegram-bot-api';
import {config} from 'dotenv';
import {Client} from "@notionhq/client"

config();

const telegramToken = process.env.TELEGRAM_API_TOKEN;
const notionToken = process.env.NOTION_API_TOKEN
const notionPlannerDatabaseId = process.env.NOTION_PLANER_DATABASE_ID
const notionBooksDatabaseId = process.env.NOTION_BOOKS_DATABASE_ID
const notionTVDatabaseId = process.env.NOTION_TV_DATABASE_ID
const notionBotTag = process.env.NOTION_BOT_TAG
const notion = new Client({auth: notionToken})

const bot = new TelegramApi(telegramToken, {polling: true});
const notionTypes = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{text: 'Task', callback_data: '/notiontask'}],
            [{text: 'Book', callback_data: '/notionbook'}],
            [{text: 'TV', callback_data: '/notiontv'}],
        ]
    })
};

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
    return bot.sendMessage(chatId, msg.data);
})

// Handlers
async function startCommandHandler(chatId) {
    return bot.sendMessage(chatId, `Добро пожаловать!`);
}

async function notionCommandHandler(chatId) {
    // await addNotionPageToPlanner('New task');
    // await addNotionPageToBooks('New book');
    // await addNotionPageToTV('New TV');
    return bot.sendMessage(chatId, `Выберите базу данных`, notionTypes)
}

async function infoCommandHandler(chatId) {
    return bot.sendMessage(chatId, `Справка по боту`);
}

async function defaultCommandHandler(chatId, text) {
    if (text.match(/^\//)) {
        return bot.sendMessage(chatId, `Неопознанная команда! Введите /info для справки.`);
    }
    // Пока идея такая - получать историю до последней введенной команды и определять на каком шаге сейчас находимся (этот код инкапсулировать бы в классы js)
}

// Notion API
async function addNotionPageToPlanner(title) {
    try {
        const response = await notion.pages.create({
            parent: {database_id: notionPlannerDatabaseId},
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

async function addNotionPageToBooks(title) {
    try {
        const response = await notion.pages.create({
            parent: {database_id: notionBooksDatabaseId},
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

async function addNotionPageToTV(title) {
    try {
        const response = await notion.pages.create({
            parent: {database_id: notionTVDatabaseId},
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