const LIB = {
    DELAY: 1000,

    async handleCounters(name, counter, type) {
        type = type || 'timeout';
        let counters = await STORAGE.getParam('counters', {});
        if (counters[name]) {
            const {id, type} = counters[name];
            type === 'timeout' ? clearTimeout(id) : clearInterval(id);
        }
        const counterId = counter(() => counterId);
        const newCounter = {};
        newCounter[name] = {id: counterId, type: type};
        STORAGE.setParam({counters: {...counters, ...newCounter}});
    },

    wait({callback, max = this.DELAY * 15, delay = this.DELAY, name = 'waiting'}) {
        return new Promise((resolve, reject) => {
            let timeCounter = 0;
            const counter = counterIdGetter => setInterval(() => {
                const counterId = counterIdGetter();
                if (callback()) {
                    clearInterval(counterId);
                    return resolve(true)
                }
                timeCounter += delay;
                if (timeCounter >= max) {
                    clearInterval(counterId);
                    return resolve(false);
                }
            }, delay)
            this.handleCounters(name, counter, 'interval');
        });
    },
}