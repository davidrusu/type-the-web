var data = require("sdk/self").data;
var pageMod = require("sdk/page-mod");
var tabs = require("sdk/tabs");
var buttons = require('sdk/ui/button/action');
var selection = require("sdk/selection");


var mouseX = 0, mouseY = 0;
document.onmousemove(e) {
    mouseX = e.pageX;
    mouseY = e.pageY;
}

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
        if (!selection.html) {
            return;
        }
        console.log(selection.html.parentElement);
        selection.html = "<span id='ttw'>" + selection.html + "</span>";
        //console.log(selection.html);
        require("sdk/tabs").activeTab.attach({
            contentScriptFile: data.url("type-the-web.js")
        });
    }
});
