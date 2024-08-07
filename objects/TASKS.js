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

    async new(filtered) {
        filtered = filtered || true;
        const savingAttempts = await STORAGE.getParam('savingAttempts', {});
        const isAIS = LIB.isAIS();
        return TASKS.all().filter((i, task) => this.isNew(task, savingAttempts, isAIS))
    },

    isNew(task, savingAttempts, isAIS) {
        const number = this.getNumber(task, isAIS);
        if (savingAttempts && savingAttempts[number] && savingAttempts[number] >= this.MAX_SAVING_ATTEMPTS) {
            return false;
        }
        if (task && isAIS) {
            return this.hasNewAISUIDTasks(task);
        }
        return this.getStatus(task) === TASKS.STATUS_NEW
    },

    async handleSavingAttempts(number, excludeTask) {
        const savingAttempts = await STORAGE.getParam('savingAttempts', {});
        if (excludeTask) {
            savingAttempts[number] = this.MAX_SAVING_ATTEMPTS;
        } else if (savingAttempts[number]) {
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

    hasNewAISUIDTasks(task) {
        return $(task).find('.status_about_due').length
            || (this.getStatus(task) === TASKS.STATUS_NEW && $(task).find('.cell-target').first().text().indexOf('Завтра') === 0);
    },

    getNumber(task, isAIS) {
        if (task) {
            if (isAIS) {
                const numberParts = $(task).find('.cell-identifier').text().match(/\d+/);
                return numberParts[0] || '';
            }
            return $(task).find('.cell-path').text().trim();
        }
        return TASKS.getTaskHeaderData('Запрос');
    },

    getTitle(task) {
        if (task) {
            return $(task).find('.cell-subject').text().trim();
        }
        return TASKS.getTaskBlock().find('.title').text().trim();
    },

    async isNewOpenedTask() {
        const savingAttempts = await STORAGE.getParam('savingAttempts', {});
        return TASKS.isNew(null, savingAttempts, LIB.isAIS());
    },

    canBeRegistered() {
        return !TASKS.getTaskBlock().find('#toolbar_start').hasClass('disabled');
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

    async hasNew() {
        const tasks = await TASKS.new();
        return tasks.length;
    },

    async getFirstNew() {
        const tasks = await TASKS.new();
        return tasks.first();
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