const POPUP = {
    setParam(data) {
        chrome.storage.sync.set(data);
    },

    async getParam(name, defaultValue) {
        defaultValue = defaultValue || null;
        const result = await chrome.storage.sync.get(name);
        return result[name] || defaultValue;
    },

    removeParam(name) {
        chrome.storage.sync.remove(name);
    },

    async sendMessage(data) {
        return await chrome.runtime.sendMessage(data);
    },

    handlers() {
        $('#autoReg').on('click', async e => {
            const tab = await this.getParam('tab');
            if ($(e.currentTarget).prop('checked')) {
                this.setParam({running: true});
                chrome.scripting.executeScript({
                    target: {tabId: tab, allFrames: true},
                    files: ['autoreg.js'],
                });
                setTimeout(() => window.close(), 300);
            } else {
                this.removeParam('running');
                await this.sendMessage({status: 'stop'})
            }
        });

        $('a[data-target]').click(e => {
            e.preventDefault();
            $(e.currentTarget.dataset.target).slideToggle();
        });

        $('.levels-trigger').click(e => {
            $(e.target).siblings('.levels-block').slideToggle()
        });

        $('input[name="appeals-tag"]').on('click', e => {
            const state = $(e.currentTarget).is(':checked');
            this.setParam({appealsTag: state});
        });

        $('input[name="incidents-tag"]').on('click', e => {
            const state = $(e.currentTarget).is(':checked');
            this.setParam({incidentsTag: state});
        });

        $('input[name^="appeal.not-reg"]').on('click', e => {
            const states = $('input[name^="appeal.not-reg"]').map((i, el) => $(el).is(':checked'));
            this.setParam({appealNotReg: states});
        });

        $('input[name^="incident.not-reg"]').on('click', e => {
            const states = $('input[name^="incident.not-reg"]').map((i, el) => $(el).is(':checked'));
            this.setParam({incidentNotReg: states});
        });

        $('#tg-appeal-bot-api_token-btn').on('click', e => {
            e.preventDefault();
            const value = $('#tg-appeal-bot-api_token').val();
            this.setParam({tgAppealBotApiToken: value});
            $(e.currentTarget).css({'background-color': 'green'})
        });

        $('#tg-appeal-chat_id-btn').on('click', e => {
            e.preventDefault();
            const value = $('#tg-appeal-chat_id').val();
            this.setParam({tgAppealChatId: value});
            $(e.currentTarget).css({'background-color': 'green'})
        });

        $('#tg-incident-bot-api_token-btn').on('click', e => {
            e.preventDefault();
            const value = $('#tg-incident-bot-api_token').val();
            this.setParam({tgIncidentBotApiToken: value});
            $(e.currentTarget).css({'background-color': 'green'})
        });

        $('#tg-incident-chat_id-btn').on('click', e => {
            e.preventDefault();
            const value = $('#tg-incident-chat_id').val();
            this.setParam({tgIncidentChatId: value});
            $(e.currentTarget).css({'background-color': 'green'})
        });

        $('.download-logs').on('click', async e => {
            e.preventDefault();
            await this.sendMessage({status: 'logs'})
        });
    },

    async setAutoRegStatus() {
        const running = await this.getParam('running');
        $('#autoReg').prop('checked', running)
    },

    async saveCurrentTab() {
        const [tab] = await chrome.tabs.query({active: true});
        if (tab.url && (tab.url.indexOf('4me.mos.ru') === -1)) {
            return false;
        }
        this.setParam({tab: tab.id})
    },

    async fillFields() {
        const appealsTag = await this.getParam('appealsTag');
        $('input[name="appeals-tag"]')
            .prop('checked', appealsTag)
            .siblings('.levels-block')
            .css({display: appealsTag ? 'block' : 'none'})

        const incidentsTag = await this.getParam('incidentsTag');
        $('input[name="incidents-tag"]')
            .prop('checked', incidentsTag)
            .siblings('.levels-block')
            .css({display: incidentsTag ? 'block' : 'none'});

        const tgAppealBotApiToken = await this.getParam('tgAppealBotApiToken');
        if (tgAppealBotApiToken) {
            $('#tg-appeal-bot-api_token').val(tgAppealBotApiToken);
            $('#tg-appeal-bot-api_token-btn').css({'background-color': 'green'});
        }

        const tgAppealChatId = await this.getParam('tgAppealChatId');
        if (tgAppealChatId) {
            $('#tg-appeal-chat_id').val(tgAppealChatId);
            $('#tg-appeal-chat_id-btn').css({'background-color': 'green'});
        }

        const tgIncidentBotApiToken = await this.getParam('tgIncidentBotApiToken');
        if (tgIncidentBotApiToken) {
            $('#tg-incident-bot-api_token').val(tgIncidentBotApiToken);
            $('#tg-incident-bot-api_token-btn').css({'background-color': 'green'});
        }

        const tgIncidentChatId = await this.getParam('tgIncidentChatId');
        if (tgIncidentChatId) {
            $('#tg-incident-chat_id').val(tgIncidentChatId);
            $('#tg-incident-chat_id-btn').css({'background-color': 'green'});
        }
    },

    async init() {
        await this.saveCurrentTab();
        await this.setAutoRegStatus();
        await this.fillFields();
        this.handlers();
    }
}

$(() => POPUP.init());