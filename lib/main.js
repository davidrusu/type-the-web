let data = require("sdk/self").data;
let pageMod = require("sdk/page-mod");
let tabs = require("sdk/tabs");
let buttons = require('sdk/ui/button/action');
let selection = require("sdk/selection");
let self = require("sdk/self");

let panel = require("sdk/panel").Panel({
    focus: false,
    width: 450,
    height: 150,
    position: {
        bottom: 10,
        right: 10
    },
    contentURL: data.url("stats.html"),
    contentScriptFile: [ data.url("stats.js"),
                         data.url("jquery-2.1.1.min.js") ],
    contentStyleFile: [ data.url("stats.css") ]
});

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
    onClick: function() {
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
        worker.port.on("ttw-stats-updated", (data) => {
            panel.port.emit("ttw-stats-updated", data);
            panel.show();
        });

        tab.on('close', (t) => panel.port.emit('stop'));
    }
});
