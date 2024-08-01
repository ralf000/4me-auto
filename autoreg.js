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
            if (!TASKS.canBeRegistered()) {
                LOGGER.log(`Обращение ${number} не может быть зарегистрировано. Кнопка "Зарегистрировать" отключена`);
                await TASKS.handleSavingAttempts(number, true);
                LOGGER.log(`Обращение ${number} исключено из наблюдения`);
                return MESSAGES.send({status: 'restart'});
            }
            LOGGER.log(`Новое обращение ${number} открыто`);
            if (!await TASKS.handleSavingAttempts(number)) {
                LOGGER.log(`Превышено количество попыток сохранения ${TASKS.isAppeal() ? 'обращения' : 'инцидента'} ${number}`);
                await SENDER.sendExceededTaskNotificationMessage(number);
                return MESSAGES.send({status: 'restart'});
            }
            LOGGER.log(`Нажимаю кнопку "Зарегистрировать" для обращения ${number}`);
            TASKS.getApplyButton().click();
            LOGGER.log(`Жду регистрации обращения ${number}`);
            await LIB.wait({callback: TASKS.isAppliedTask, name: 'appliedTask'});
            await SENDER.sendNewTaskNotification(number);
            return MESSAGES.send({status: 'applied'});
        }
        LOGGER.log('Получаю первое новое обращение');
        const newTask = await TASKS.getFirstNew();
        if (newTask.length) {
            const number = TASKS.getNumber(newTask, LIB.isAIS());
            LOGGER.log(`Нажимаю на обращение ${number}`);
            newTask.click();
            LOGGER.log(`Жду открытия обращения ${number}`);
            await LIB.wait({callback: await TASKS.isNewOpenedTask, name: 'newOpenedTask'});
            LOGGER.log(`Отправляю сообщение об открытии обращения ${number}`);
            return MESSAGES.send({status: 'opened'});
        }
        return MESSAGES.send({status: 'restart'});
    },

    async checkNewTasks(message) {
        const hasNew = await TASKS.hasNew();
        if (!hasNew) LOGGER.log(message);
        return hasNew;
    },

    async checkAISUIDNewTasks() {
        return true;
    },

    async findNewTasks() {
        const message = 'Нет новых обращений. Продолжаю наблюдение ಠ_ಠ';
        LOGGER.log(message);
        //если это АИС, то просто обновляем страницу (новые обращения/инциденты сами не появляются)
        //иначе проверяем наличие без перезагрузки через интервал времени
        await LIB.wait({
            callback: async () => LIB.isAIS() ? this.checkAISUIDNewTasks() : this.checkNewTasks(message),
            delay: 1000 * 60,
            max: 1000 * 60 * 20
        });
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
    LOGGER.log('Старт');
    AUTOREG.run();
} catch (e) {
    typeof LOGGER === 'undefined' ? console.error(e) : LOGGER.log(e);
    MESSAGES.send({status: 'restart'});
}