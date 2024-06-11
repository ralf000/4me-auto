const CLEANER = {
    async clean() {
        STORAGE.removeParam('running');
        STORAGE.removeParam('savingAttempts');
        await this.cleanCounters();
        LAYER.deleteTopLayer();
    },

    async cleanCounters() {
        let counters = await STORAGE.getParam('counters', {});
        for (const name in counters) {
            const {id, type} = counters[name];
            type === 'timeout' ? clearTimeout(id) : clearInterval(id);
        }
        STORAGE.removeParam('counters');
    }
};

