async function getParam(name, defaultValue) {
    defaultValue = defaultValue || null;
    const result = await chrome.storage.sync.get(name);
    return result[name] || defaultValue;
}

function setParam(data) {
    chrome.storage.sync.set(data);
}

function executeAutoReg(tab) {
    chrome.scripting.executeScript({
        target: {tabId: tab, allFrames: true},
        // func: AUTOREG.run,
        files: ['autoreg.js'],
    });
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.session.setAccessLevel({accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS'});
});

chrome.runtime.onMessage.addListener(
    async ({status}, sender, sendResponse) => {
        const tab = await getParam('tab');
        if (status === 'restart') {
            chrome.tabs.reload(tab, () => {
                chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                    console.log(info);
                    console.log(tab);
                    if (info.status === 'complete' && tabId === tab) {
                        chrome.tabs.onUpdated.removeListener(listener);
                        setTimeout(() => executeAutoReg(tab), 1000);
                    }
                });
            });
            return;
        }
        if (status === 'logs') {
            setParam({command: 'logs'});
        }
        //for other cases
        await executeAutoReg(tab);
    }
);