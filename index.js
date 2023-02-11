import TelegramApi from 'node-telegram-bot-api';
import {config} from 'dotenv';

config();

const token = process.env.TELEGRAM_API_TOKEN;

const bot = new TelegramApi(token, {polling: true});
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
            return bot.sendMessage(chatId, `Добро пожаловать!`);
            break;
        case '/notion':
            return bot.sendMessage(chatId, `Выберите базу данных`, notionTypes);
            break;
        case '/notiontask':
            return bot.sendMessage(chatId, `Напишите или воспользуйтесь голосовым помошником`);
            break;
        case '/notionbook':
            return bot.sendMessage(chatId, `Напишите или воспользуйтесь голосовым помошником`);
            break;
        case '/notiontv':
            return bot.sendMessage(chatId, `Напишите или воспользуйтесь голосовым помошником`);
            break;
        case '/info':
            return bot.sendMessage(chatId, `Справка по боту`);
            break;
        default:
            return bot.sendMessage(chatId, `Неопознанная команда! Введите /info для справки.`);
            break;
    }
})

bot.on('callback_query', async msg => {
    const chatId = msg.message.chat.id;
    return bot.sendMessage(chatId, msg.data);
})