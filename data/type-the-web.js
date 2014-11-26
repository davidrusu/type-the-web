var CharStyle = {
    COR: mkCorrect,
    WRG: mkWrong,
    CUR: mkCursor,
    DEF: R.identity
};

var BURST_TIME = 5; // seconds
var WORD_LENGTH = 5; // chars
var ERROR_PENALTY = 0.5; // how many wpm to take off for every error

function mkCursor(text) {
    return "<span class='ttw-typed' id='ttw-cursor'>" + text + "</span>";
}

function mkWrong(text) {
    return "<span class='ttw-typed ttw-wrong'>" + text + "</span>";
}

function mkCorrect(text) {
    return "<span class='ttw-typed ttw-correct'>" + text + "</span>";
}

function renderText(elem, content, contentStyleMap) {
    var result = "";
    var run = content.charAt(0);
    var prevStyler = contentStyleMap[0];
    
    for (var i = 1; i < contentStyleMap.length; i++) {
        var charStyler = contentStyleMap[i];
        if (prevStyler != charStyler) {
            result += prevStyler(run);
            prevStyler = charStyler;
            run = '';
        }
        run += content.charAt(i);
    }
    
    result += prevStyler(run);
    $(elem).html(result);
}

function reset(spanElem, backup) {
    $(spanElem).html(backup);
    var newTextNode = $(spanElem).contents()[0];
    $(newTextNode).unwrap();
    return newTextNode;
}

var constant = R.curry(function(x, y) {
    return x;
});

function start(elem) {
    var content = elem.nodeValue;
    var contentStyleMap = R.repeatN(CharStyle.DEF, content.length);
    var cursorIdx = 0;
    contentStyleMap[cursorIdx] = CharStyle.CUR;

    $(elem).wrap("<span class='ttw'></span>");
    var spanElem = $(elem).parent();
    
    renderText(spanElem, content, contentStyleMap);
    
    var timeStamp = -1;
    $(document).keypress(handleKeyPress);
    var keysTyped = 0;
    var errorsTyped = 0;
    var keys
    function handleKeyPress(e) {
        if (timeStamp === -1) {
            timeStamp = new Date().getTime();
        }
        
        var charCode = (typeof e.which == "number") ? e.which : e.keyCode;

        var typedChar = String.fromCharCode(charCode);
        var cursorChar = content.charAt(cursorIdx);
        
        var charStyle;
        if (cursorChar === typedChar) {
            charStyle = CharStyle.COR;
        } else {
            charStyle = CharStyle.WRG;
        }
        contentStyleMap[cursorIdx] = charStyle;
        
        cursorIdx += 1;
        if (cursorIdx >= content.length) {
            var timeDelta = new Date().getTime() - timeStamp;
            alert("You took " + timeDelta / 1000 + "s");
            $(document).unbind('keypress', handleKeyPress);
            
            var node = reset(spanElem, content);
            var nextElem = nextTextElement(node);

            if (nextElem) {
                start(nextElem);
            }
        } else {
            contentStyleMap[cursorIdx] = CharStyle.CUR;
            renderText(spanElem, content, contentStyleMap);
        }
        return false;
    }
}

function nextTextElement(elem) {
    var allTextNodes = [];
    function findAllTextNodes(node) {
        if (node.hasChildNodes()) {
            R.map(findAllTextNodes, node.childNodes);
        } else if (node.nodeType == 3 && node.nodeValue.trim().length) {
            allTextNodes.push(node);
        }
    }
    findAllTextNodes($('body')[0]);
    
    var rest = R.skipUntil(
        function (other) {
            return elem == other;
        }
        , allTextNodes
    );
    
    if (rest.length >= 2) {
        return rest[1];
    } else {
        return false;
    }
}

function isWhiteSpace(str) {
    return str.trim().length >= 1;
}

function firstChildTextNode(elem) {
    var textNodes = $(elem).contents()
            .filter(function() {
                return this.nodeType === 3;
            })
            .filter(function () {
                return this.nodeValue.trim().length >= 1;
            });
    return textNodes ? textNodes[0] : false;
}

var prevElem;
function highlightTextNodes(e) {
    var elem = firstChildTextNode(
        document.elementFromPoint(e.clientX, e.clientY));
    
    if (!Object.is(prevElem, elem)) {
        if (prevElem) {
            $(prevElem).unwrap();
            prevElem = null;
        }
        if (elem) {
            $(elem).wrap("<span class='ttw-selected'></span>");
            prevElem = elem;
        }
    }
}

function formatHUDText(numTyped, numErrors, numCharsBurst) {
    return numTyped + " typed, " + numErrors + " errors"
        + "</br>"
        + numCharsBurst / WORD_LENGTH * BURST_TIME + " burst wpm"
        + numTyped / WORD_LENGTH - numErrors * ERROR_PENALTY + "wpm";
}

function initHUD() {
    $("<div id='ttw-hud'></div>").appendTo("body");
}

function killHUD() {
    $("#ttw-hud").remove();
}

function setupTest(e) {
    var textNode = firstChildTextNode(
        document.elementFromPoint(e.clientX, e.clientY));
    if (textNode) {
        $(document).unbind("mousemove", highlightTextNodes);
        $(document).unbind("click", setupTest);
        
        $(textNode).unwrap(); // it'll be wrapped in a span from the mousemove
        initHUD();
        start(textNode);
        return false;
    }
    return true;
}
    
$(document).mousemove(highlightTextNodes);
$(document).click(setupTest);
