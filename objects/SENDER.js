const SENDER = {
    async sendNewTaskNotification(number, title) {
        if (!await this.isAllowedToSendNewTaskNotification(number)) return false;

        const newTaskSentMessages = await STORAGE.getParam('newTaskSentMessages', []);
        newTaskSentMessages.push(number);
        STORAGE.setParam({newTaskSentMessages});

        LOGGER.log(`Отправляю оповещение об обнаружении ${TASKS.isAppeal() ? 'обращения' : 'инцидента'} ${number}`);
        const message = this.getNewTaskTelegramMessage(number, title);
        return this.send(message);
    },

    async sendExceededTaskNotificationMessage(number, priority, title, date) {
        if (!await this.isAllowedToSendExceededTaskNotification(number)) return false;

        LOGGER.log(`Отправляю оповещение об обнаружении превышения попыток регистрации ${TASKS.isAppeal() ? 'обращения' : 'инцидента'} ${number}`);

        const message = this.getExceededTaskTelegramMessage(number, title);
        this.send(message, async () => {
                const exceededTaskSentMessages = await STORAGE.getParamSavedParam('exceededTaskSentMessages', []);
                exceededTaskSentMessages.push(number);
                STORAGE.setParam({exceededTaskSentMessages});
            }
        );
    },

    send(message, successCallback, errorCallback) {
        $.ajax({
            url: this.getTelegramUrl(),
            type: "POST",
            dataType: 'json',
            data: message,
            success: ({ok}) => {
                if (ok) {
                    if (successCallback) return successCallback();
                }
                if (errorCallback) return errorCallback();
            },
            error: ({responseJSON}) => {
                console.error(responseJSON);
                if (errorCallback) return errorCallback();
            }
        });
    },


    async getTelegramUrl() {
        let botToken = '';
        if (TASKS.isAppeal()) {
            const tgAppealBotApiToken = await STORAGE.getParam('tgAppealBotApiToken');
            botToken = tgAppealBotApiToken;
        } else {
            const tgIncidentBotApiToken = await STORAGE.getParam('tgIncidentBotApiToken');
            botToken = tgIncidentBotApiToken;
        }
        return `https://api.telegram.org/bot${botToken}/sendMessage`;
    },

    async getNewTaskTelegramMessage(number, priority, title, date) {
        const appeal = TASKS.isAppeal();
        let chatId = '';
        if (appeal) {
            const tgAppealChatId = await STORAGE.getParam('tgAppealChatId');
            chatId = tgAppealChatId;
        } else {
            const tgIncidentChatId = await STORAGE.getParam('tgIncidentChatId');
            chatId = tgIncidentChatId;
        }
        const text1 = appeal ? 'Новое' : 'Новый';
        const taskName = appeal ? 'обращение' : 'инцидент';
        const text = `${text1} ${taskName}.\n<b>Номер</b>: ${number}.\n<b>Название</b>: ${title}.\n`;

        return {chat_id: chatId, text: text, parse_mode: 'html'};
    },

    async getExceededTaskTelegramMessage(number, title) {
        let chatId = '';
        let taskName = '';
        if (TASKS.isAppeal()) {
            const tgAppealChatId = await STORAGE.getParam('tgAppealChatId');
            chatId = tgAppealChatId;
            taskName = 'обращения';
        } else {
            const tgIncidentChatId = await STORAGE.getParam('tgIncidentChatId');
            chatId = tgIncidentChatId;
            taskName = 'инцидентов';
        }
        const text = `<b>Превышено количество попыток регистрации ${taskName}</b>.\n<b>Номер</b> ${number}.\n<b>Название</b>: ${title}\n`;
        return {chat_id: chatId, text: text, parse_mode: 'html'};
    },

    async isAllowedToSendNewTaskNotification(number) {
        const newTaskSentMessages = await STORAGE.getParamSavedParam('newTaskSentMessages', []);
        if ($.inArray(number, newTaskSentMessages) !== -1) return false;
        if (!await this.isCorrectTelegramNotificationSettings()) return false;

        return true;
    },

    async isAllowedToSendExceededTaskNotification(number) {
        if (!await this.isCorrectTelegramNotificationSettings()) return false;
        const exceededTaskSentMessages = await STORAGE.getParamSavedParam('exceededTaskSentMessages', []);
        return $.inArray(number, exceededTaskSentMessages) !== -1;
    },

    async isCorrectTelegramNotificationSettings() {
        const appealsTag = await STORAGE.getParam('appealsTag');
        const tgAppealBotApiToken = await STORAGE.getParam('tgAppealBotApiToken');
        const tgAppealChatId = await STORAGE.getParam('tgAppealChatId');
        if (this.isAppeal() && (!appealsTag || !tgAppealBotApiToken || !tgAppealChatId)) return false;

        const incidentsTag = await STORAGE.getParam('incidentsTag');
        const tgIncidentBotApiToken = await STORAGE.getParam('tgIncidentBotApiToken');
        const tgIncidentChatId = await STORAGE.getParam('tgIncidentChatId');
        if (this.isIncident() && (!incidentsTag || !tgIncidentBotApiToken || !tgIncidentChatId)) return false;

        return true;
    },
};