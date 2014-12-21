let data = require("sdk/self").data;
let pageMod = require("sdk/page-mod");
let tabs = require("sdk/tabs");
let buttons = require('sdk/ui/button/action');
let selection = require("sdk/selection");
let self = require("sdk/self");
let panel = require("sdk/panel");

/**
 * We inject our css into every webpage because it's
 * currently not convenient to inject when the plugin is run
 *
 * We do prefix all css ids/classes with 'ttw' to
 * hopefully avoid naming collisions
*/
pageMod.PageMod({
    include: "*",
    contentStyleFile: [ data.url("style.css") ]
});

/**
 * list of tabs where a typing test is in progress
 * Used to avoid starting multiple tests in one tab
*/
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

        // We check if we are in a tab where a test is active
        for (let tuple of attachedTabs) {
            let [testTab, testUrl, stopfn] = tuple;
            if (testTab === tab && testUrl === tab.url) {
                stopfn(); // stop the active test
                return;
            }
        }
        
        let tuple = [ tab, tab.url, stop ];
        attachedTabs.push(tuple);
        
        let worker = tab.attach({
            contentScriptFile: [ data.url("jquery-2.1.1.min.js"),
                                 data.url("ramda-0.8.0.min.js"),
                                 data.url("constants.js"),
                                 data.url("type-the-web.js") ]
        });

        let statsPanel = panel.Panel({
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

        worker.port.on("ttw-stats-updated", (statsData) => {
            statsPanel.port.emit("ttw-stats-updated", statsData);
            statsPanel.show(); // make sure the panel is still visible
        });
        
        let stop = () => {
            if (!running) return; // we don't want to stop twice
            running = false;
            worker.port.emit('stop');
            statsPanel.port.emit('stop');
            removeAttachedTab();
            // we don't destroy the statsPanel because users will want to see the stats
        };
        
        let removeAttachedTab = () => {
            console.log('removing tab and url');
            let i = attachedTabs.indexOf(tuple);
            if (i > -1) {
                attachedTabs.splice(i, 1);
            }
        };
        
        worker.port.on('stopping', (t) => stop());
        tab.on('close', (t) => removeAttachedTab());
        statsPanel.port.on('stop', () => stop());
        statsPanel.port.on('skip', () => worker.port.emit('skip'));
    }
});
