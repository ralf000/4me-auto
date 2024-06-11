const TASKS = {
    STATUS_NEW: 'Назначено',
    STATUS_APPLIED: 'В процессе',
    TYPE: '',
    TYPE_APPEAL: 'Обращение',
    TYPE_INCIDENT: 'Инцидент',
    //макс. попыток сохранить обращение/инцидент
    MAX_SAVING_ATTEMPTS: 5,

    all() {
        return $('#view_list .grid-row');
    },

    tasksBlock() {
        return $('#view_list_container');
    },

    new(filtered) {
        filtered = filtered || true;
        return TASKS.all().filter(this.isNewFilter)
    },

    isNew(task) {
        return $(task).find('.cell-status').text().trim() === TASKS.STATUS_NEW
    },

    /**
     * find new tasks in list according to settings
     */
    async isNewFilter(i, task) {
        const number = this.getNumber(task);
        const savingAttempts = await STORAGE.getParam('savingAttempts', {});
        //фильтруем талоны с превышенным количеством попыток их сохранить
        if (savingAttempts && savingAttempts[number] && savingAttempts[number] >= this.MAX_SAVING_ATTEMPTS) {
            return false;
        }
        return this.isNew(task);
    },

    async handleSavingAttempts(number) {
        const savingAttempts = await STORAGE.getParam('savingAttempts', {});
        if (savingAttempts[number]) {
            savingAttempts[number]++;
        } else {
            savingAttempts[number] = 1;
        }
        STORAGE.setParam({savingAttempts});
        return savingAttempts[number] < this.MAX_SAVING_ATTEMPTS;
    },

    getTaskBlock() {
        return $('#details-container');
    },

    getTaskHeaderData(name) {
        return TASKS.getTaskBlock().find(`.header_bar_label:contains('${name}')`).closest('.header_bar_section').find('.data').text().trim();
    },

    getStatus(task) {
        if (task) {
            return $(task).find('.cell-status').text().trim();
        }
        return TASKS.getTaskHeaderData('Статус');
    },

    getNumber(task) {
        if (task) {
            return $(task).find('.cell-path').text().trim().match(/^\d+/)[0];
        }
        return TASKS.getTaskHeaderData('Запрос');
    },

    getTitle(task) {
        if (task) {
            return $(task).find('.cell-subject').text().trim();
        }
        return TASKS.getTaskHeaderData('Запрос');
    },

    isNewOpenedTask() {
        return TASKS.getStatus() === TASKS.STATUS_NEW;
    },

    isAppliedTask() {
        return TASKS.getStatus() === TASKS.STATUS_APPLIED;
    },

    getApplyButton() {
        return $('#toolbar_start');
    },

    isTaskOpened() {
        return TASKS.getStatus();
    },

    hasNew() {
        return TASKS.new().length;
    },

    getFirstNew() {
        return TASKS.new().first();
    },

    setType() {
        this.TYPE = 'Обращение';
    },

    isAppeal() {
        return this.TYPE === this.TYPE_APPEAL;
    },

    isIncident() {
        return this.TYPE === this.TYPE_INCIDENT;
    },
};