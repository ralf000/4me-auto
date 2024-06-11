const STORAGE = {
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
    setSessionParam(data) {
        chrome.storage.session.set(data);
    },
    getSessionParam(name) {
        return chrome.storage.session.get(name);
    },
    removeSessionParam(name) {
        chrome.storage.session.remove(name);
    },
}