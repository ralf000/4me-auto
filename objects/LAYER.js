const LAYER = {
    getTopLayer() {
        return $('#toplayer');
    },

    async buildTopLayer() {
        const {data, background = '#fff', loader, text = 'Авторегистрация'} = await this.getLoaderImage();
        return `<div id="toplayer" style="position: fixed;top:0;right:0;left:0;bottom:0;z-index:9999999;opacity:.8;background-color:${background};display: flex;align-items: center;justify-content: center;"><div style="display: flex;flex-direction: column;text-align: center;"><img src="${data}" />${text}</div></div>`;
    },

    async getLoaderImage() {
        const loaders = await DATA.getLocalJson('data/loaders.json');
        return loaders[(new Date()).getDay() % loaders.length];
    },

    async addTopLayerOnPage() {
        if (this.getTopLayer().length === 0) {
            $('body').append(await this.buildTopLayer());
        }
    },

    deleteTopLayer() {
        const topLayer = this.getTopLayer();
        if (topLayer.length !== 0) {
            topLayer.remove();
        }
    }
};