let self = require("sdk/self");
let data = self.data;
let pageMod = require("sdk/page-mod");
let tabs = require("sdk/tabs");
let buttons = require('sdk/ui/button/action');
let sidebar = require("sdk/ui/sidebar");
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

let statsSidebar = sidebar.Sidebar({
    id: 'ttw-stats-sidebar',
    title: 'Stats Sidebar',
    url: data.url("stats.html")
});

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

        let greetingPanel = panel.Panel({
            width: 400,
            height: 230,
            position: {
                right: 10,
                top: 10
            },
            contentURL: data.url("greeting.html")
        });
        greetingPanel.show();
            
        
        let worker = tab.attach({
            contentScriptFile: [ data.url("jquery-2.1.1.min.js"),
                                 data.url("ramda-0.8.0.min.js"),
                                 data.url("constants.js"),
                                 data.url("nonstandard-char-map.js"),
                                 data.url("replace-map.js"),
                                 data.url("type-the-web.js") ]
        });
        let sidebarOnAttach = (statsWorker) => {
            worker.port.on("ttw-stats-updated", (statsData) => {
                statsWorker.port.emit("stats-updated", statsData);
                statsSidebar.show();
            });
        };
        statsSidebar.on('attach', sidebarOnAttach);
        statsSidebar.show();
        
        let stop = () => {
            if (!running) return; // we don't want to stop twice
            try {
                worker.port.emit('stop');
                removeAttachedTab();
                running = false;
            } catch (e) {}
            statsSidebar.removeListener('attach', sidebarOnAttach);
            statsSidebar.removeListener('hide', stop);
            statsSidebar.hide();
        };

        let tuple = [ tab, tab.url, stop ];
        attachedTabs.push(tuple);
        
        let removeAttachedTab = () => {
            let i = attachedTabs.indexOf(tuple);
            if (i > -1) {
                attachedTabs.splice(i, 1);
            }
        };
        
        worker.port.on('stopping', stop);
        tab.on('close', stop);
        tab.on('ready', stop);
        tab.on('pageshow', stop);
    }
});

function onOpen(tab) {
    // We wrap hide because hide applied with an argument means something other than hide()
    tab.on("pageshow", (tab) => statsSidebar.hide());
    tab.on("activate", (tab) => statsSidebar.hide());
    tab.on("deactivate", (tab) => statsSidebar.hide());
    tab.on("close", (tab) => statsSidebar.hide());
}
tabs.on('open', onOpen);
