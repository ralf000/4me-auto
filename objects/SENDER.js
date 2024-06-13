const SENDER = {
    async sendNewTaskNotification(number) {
        if (!await this.isAllowedToSendNewTaskNotification(number)) return false;

        LOGGER.log(`Отправляю сообщение о регистрации ${TASKS.isAppeal() ? 'обращения' : 'инцидента'} ${number}`);
        const message = await this.getNewTaskTelegramMessage(number);
        return await this.send(message, async () => {
            const newTaskSentMessages = await STORAGE.getParam('newTaskSentMessages', []);
            newTaskSentMessages.push(number);
            STORAGE.setParam({newTaskSentMessages});
        });
    },

    async sendExceededTaskNotificationMessage(number) {
        if (!await this.isAllowedToSendExceededTaskNotification(number)) return false;

        LOGGER.log(`Отправляю оповещение об обнаружении превышения попыток регистрации ${TASKS.isAppeal() ? 'обращения' : 'инцидента'} ${number}`);

        const message = await this.getExceededTaskTelegramMessage(number);
        await this.send(message, async () => {
                const exceededTaskSentMessages = await STORAGE.getParam('exceededTaskSentMessages', []);
                exceededTaskSentMessages.push(number);
                STORAGE.setParam({exceededTaskSentMessages});
            }
        );
    },

    async send(message, successCallback, errorCallback) {
        console.log(message);
        $.ajax({
            url: await this.getTelegramUrl(),
            type: "POST",
            dataType: 'json',
            data: message,
            success: ({ok}) => {
                if (ok) {
                    if (successCallback) return successCallback();
                }
                if (errorCallback) return errorCallback();
            },
            error: (data) => {
                console.error(data);
                if (errorCallback) return errorCallback();
            }
        });
    },


    async getTelegramUrl() {
        let botToken = TASKS.isAppeal() ? await STORAGE.getParam('tgAppealBotApiToken') : await STORAGE.getParam('tgIncidentBotApiToken')
        return `https://api.telegram.org/bot${botToken}/sendMessage`;
    },

    async getNewTaskTelegramMessage(number, priority, title) {
        const isAppeal = TASKS.isAppeal();
        let chatId = isAppeal ? await STORAGE.getParam('tgAppealChatId') : await STORAGE.getParam('tgIncidentChatId');
        const text1 = isAppeal ? 'Новое' : 'Новый';
        const taskName = isAppeal ? 'обращение' : 'инцидент';
        const text = `${text1} ${taskName}.\n<b>Номер</b>: ${number}.\n<b>Название</b>: ${TASKS.getTitle()}.\n`;

        return {chat_id: chatId, text: text, parse_mode: 'html'};
    },

    async getExceededTaskTelegramMessage(number) {
        const isAppeal = TASKS.isAppeal();
        let chatId = isAppeal ? await STORAGE.getParam('tgAppealChatId') : await STORAGE.getParam('tgIncidentChatId');
        let taskName = isAppeal ? 'обращения' : 'инцидентов';
        const text = `<b>Превышено количество попыток регистрации ${taskName}</b>.\n<b>Номер</b> ${number}.\n<b>Название</b>: ${TASKS.getTitle()}\n`;
        return {chat_id: chatId, text: text, parse_mode: 'html'};
    },

    async isAllowedToSendNewTaskNotification(number) {
        const newTaskSentMessages = await STORAGE.getParam('newTaskSentMessages', []);
        if ($.inArray(number, newTaskSentMessages) !== -1) return false;
        return await this.isCorrectTelegramNotificationSettings();
    },

    async isAllowedToSendExceededTaskNotification(number) {
        if (!await this.isCorrectTelegramNotificationSettings()) return false;
        const exceededTaskSentMessages = await STORAGE.getParam('exceededTaskSentMessages', []);
        return $.inArray(number, exceededTaskSentMessages) === -1;
    },

    async isCorrectTelegramNotificationSettings() {
        const appealsTag = await STORAGE.getParam('appealsTag');
        const tgAppealBotApiToken = await STORAGE.getParam('tgAppealBotApiToken');
        const tgAppealChatId = await STORAGE.getParam('tgAppealChatId');
        if (TASKS.isAppeal() && (!appealsTag || !tgAppealBotApiToken || !tgAppealChatId)) return false;

        const incidentsTag = await STORAGE.getParam('incidentsTag');
        const tgIncidentBotApiToken = await STORAGE.getParam('tgIncidentBotApiToken');
        const tgIncidentChatId = await STORAGE.getParam('tgIncidentChatId');
        if (TASKS.isIncident() && (!incidentsTag || !tgIncidentBotApiToken || !tgIncidentChatId)) return false;

        return true;
    },
};