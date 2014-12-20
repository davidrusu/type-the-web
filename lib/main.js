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

let attachedTabs = []; // :: [(tab, url)]

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
        
        let running = true;
        for (let tuple of attachedTabs) {
            let [testTab, testUrl, stopfn] = tuple;
            if (testTab === tab && testUrl === tab.url) {
                stopfn();
                console.log('pressed button while running');
                return;
            }
        }

        let worker = tab.attach({
            contentScriptFile: [ data.url("jquery-2.1.1.min.js"),
                                 data.url("ramda-0.8.0.min.js"),
                                 data.url("constants.js"),
                                 data.url("type-the-web.js") ]
        });

        let panel = require("sdk/panel").Panel({
            focus: false,
            width: 330,
            height: 120,
            position: {
                bottom: 10,
                right: 10
            },
            contentURL: data.url("stats.html"),
            contentScriptFile: [ data.url("jquery-2.1.1.min.js"),
                                 data.url("constants.js"),
                                 data.url("stats.js") ],
            contentStyleFile: [ data.url("stats.css") ]
        });
        
        worker.port.on("ttw-stats-updated", (data) => {
            panel.port.emit("ttw-stats-updated", data);
            panel.show();
        });

        let stop = () => {
            if (!running) return; // we don't want to stop twice
            running = false;
            console.log("stopping");
            worker.port.emit('stop');
            removeAttachedTab();
        };
        
        let tuple = [ tab, tab.url, stop ];
        attachedTabs.push(tuple);
        let removeAttachedTab = () => {
            console.log('removing tab');
            let i = attachedTabs.indexOf(tuple);
            if (i > -1) {
                attachedTabs.splice(i, 1);
            }
        };
        worker.port.on('stopping', (t) => stop());
        tab.on('close', (t) => removeAttachedTab());
        tab.on('pageshow', (t) => stop());
        panel.port.on('stop', () => stop());
        panel.port.on('skip', () => worker.port.emit('skip'));
    }
});
