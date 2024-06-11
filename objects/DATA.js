const DATA = {
    async getLocalJson(path) {
        const url = chrome.runtime.getURL(path);
        const response = await fetch(url);
        return response.json();
    }
};