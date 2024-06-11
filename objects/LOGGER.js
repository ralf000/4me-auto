const LOGGER = {
    log(message, date) {
        date = date || (new Date().toLocaleString());
        console.log(`${date}: ${message}`);
        this.set(date, message);
    },

    async set(date, message) {
        let logs = await this.all();
        if (logs.length) {
            const {date: prevDate, message: prevMessage} = logs[logs.length - 1]
            //if the last log is equal to the new one - do not add
            if (prevMessage === message) return;
            logs.push({date, message});
        } else {
            logs = [{date, message}]
        }
        STORAGE.setSessionParam({logs: logs});
    },

    all() {
        return STORAGE.getSessionParam('logs', []);
    }
};