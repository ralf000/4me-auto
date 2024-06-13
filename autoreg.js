AUTOREG = {
    /**
     * отслеживает состояние программы
     */
    async checkAppStatus() {
        const running = await STORAGE.getParam('running');
        if (running) {
            return LAYER.addTopLayerOnPage();
        }
        await CLEANER.clean();
    },

    async checkTasks() {
        if (!await STORAGE.getParam('running')) {
            LOGGER.log('Программа остановлена');
            return;
        }
        const hasNew = await TASKS.hasNew();
        if (hasNew) {
            await this.handleNewTasks();
        } else {
            await this.findNewTasks();
        }
    },

    async handleNewTasks() {
        LOGGER.log('Есть новые обращения');
        if (await TASKS.isNewOpenedTask()) {
            const number = TASKS.getTaskHeaderData('Запрос');
            LOGGER.log(`Новое обращение ${number} открыто`);
            if (!await TASKS.handleSavingAttempts(number)) {
                LOGGER.log(`Превышено количество попыток сохранения ${TASKS.isAppeal() ? 'обращения' : 'инцидента'} ${number}`);
                await SENDER.sendExceededTaskNotificationMessage(number);
                return MESSAGES.send({status: 'restart'});
            }
            LOGGER.log(`Нажимаю кнопку "Зарегистрировать" для обращения ${number}`);
            // TASKS.getApplyButton().click();
            LOGGER.log(`Жду регистрации обращения ${number}`);
            await LIB.wait({callback: TASKS.isAppliedTask, name: 'appliedTask'});
            await SENDER.sendNewTaskNotification(number);
            return MESSAGES.send({status: 'applied'});
        }
        LOGGER.log('Получаю первое новое обращение');
        const newTask = await TASKS.getFirstNew();
        if (newTask.length) {
            const number = TASKS.getNumber(newTask);
            LOGGER.log(`Нажимаю на обращение ${number}`);
            newTask.click();
            LOGGER.log(`Жду открытия обращения ${number}`);
            await LIB.wait({callback: await TASKS.isNewOpenedTask, name: 'newOpenedTask'});
            LOGGER.log(`Отправляю сообщение об открытии обращения ${number}`);
            return MESSAGES.send({status: 'opened'});
        }
        return MESSAGES.send({status: 'restart'});
    },

    async findNewTasks() {
        const message = 'Нет новых обращений. Продолжаю наблюдение ಠ_ಠ';
        LOGGER.log(message);
        await LIB.wait({
            callback: async () => {
                const hasNew = await TASKS.hasNew();
                if (!hasNew) LOGGER.log(message);
                return hasNew;
            },
            delay: 1000 * 2,
            max: 1000 * 6 * 60
        })//30min
        LOGGER.log('Нет новых обращений. Запускаю рестарт');
        await MESSAGES.send({status: 'restart'});
    },

    async invokeAdditionalCommands() {
        let command = await STORAGE.getParam('command', '', true);
        if (command === 'logs') {
            await LOGGER.download();
        }
    },

    async run() {
        await this.invokeAdditionalCommands();
        if (!TASKS.tasksBlock().length) {
            LOGGER.log('Страница не загрузилась. Запускаю рестарт');
            return await MESSAGES.send({status: 'restart'});
        }
        await this.checkAppStatus();
        TASKS.setType();
        await this.checkTasks();
    }
};

try {
    AUTOREG.run();
} catch (e) {
    typeof LOGGER === 'undefined' ? console.error(e) : LOGGER.log(e);
    MESSAGES.send({status: 'restart'});
}