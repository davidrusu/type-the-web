var data = require("sdk/self").data;
var pageMod = require("sdk/page-mod");
var tabs = require("sdk/tabs");
var buttons = require('sdk/ui/button/action');
var selection = require("sdk/selection");


pageMod.PageMod({
    include:"*",
    contentStyleFile: data.url("style.css")
});

var button = buttons.ActionButton({
    id: "type-the-web",
    label: "Type The Web",
    icon: {
        "16": "./icon-16.png",
        "32": "./icon-32.png",
        "64": "./icon-64.png"
    },
    onClick: function() {
        require("sdk/tabs").activeTab.attach({
            contentScriptFile: [ data.url("jquery-2.1.1.min.js"),
                                 data.url("type-the-web.js") ]
        });
    }
});
