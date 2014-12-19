let data = require("sdk/self").data;
let pageMod = require("sdk/page-mod");
let tabs = require("sdk/tabs");
let buttons = require('sdk/ui/button/action');
let selection = require("sdk/selection");
let self = require("sdk/self");


pageMod.PageMod({
    include: "*",
    contentStyleFile: [ data.url("style.css") ]
});

let attachedTabs = [];

let button = buttons.ActionButton({
    id: "type-the-web",
    label: "Type The Web",
    icon: {
        "16": "./icon-16.png",
        "32": "./icon-32.png",
        "64": "./icon-64.png"
    },
    onClick: () => {
        let tab = tabs.activeTab;
        if (attachedTabs.indexOf(tab.url) !== -1) {
            return;
        }
        attachedTabs.push(tab.url);
        let worker = tab.attach({
            contentScriptFile: [ data.url("jquery-2.1.1.min.js"),
                                 data.url("ramda-0.8.0.min.js"),
                                 data.url("type-the-web.js") ]
        });

        let panel = require("sdk/panel").Panel({
            focus: false,
            width: 450,
            height: 150,
            position: {
                bottom: 10,
                right: 10
            },
            contentURL: data.url("stats.html"),
            contentScriptFile: [
                data.url("jquery-2.1.1.min.js"),
                data.url("stats.js") ],
            contentStyleFile: [ data.url("stats.css") ]
        });
        
        worker.port.on("ttw-stats-updated", (data) => {
            panel.port.emit("ttw-stats-updated", data);
            panel.show();
        });

        let stop = () => {
            worker.port.emit('stop');
            let i = attachedTabs.indexOf(tab.url);
            if (i > -1) {
                attachedTabs.splice(tab.url, 1);
            }
        };

        tab.on('close', (t) => stop());
        tab.on('pageshow', (t) => stop());
        panel.port.on('stop', () => stop());
        panel.port.on('skip', () => worker.port.emit('skip'));
    }
});
