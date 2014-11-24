var CharStyling = {
    CORRECT: mkCorrect,
    WRONG: mkWrong,
    CURSOR: mkCursor,
    UNTYPED: function(text) { return text; } // identity func
};

function mkCursor(text) {
    return "<span id='ttw-cursor'>" + text + "</span>";
}

function mkWrong(text) {
    return "<span class='ttw-wrong'>" + text + "</span>";
}

function mkCorrect(text) {
    return "<span class='ttw-correct'>" + text + "</span>";
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

function reset(elem, backup) {
    $(elem).html(backup);
    $(elem).contents().unwrap();
}

function start(elem) {
    $(elem).wrap("<span class='ttw'></span>");
    elem = $(elem).parent();
    
    var content = $(elem).text();
    var contentStyleMap = [CharStyling.CURSOR];
    for (var i = 1; i < content.length; i++) {
        contentStyleMap.push(CharStyling.UNTYPED);
    }
    
    var cursorIndex = 0;
    renderText(elem, content, contentStyleMap);
    
    var timeStamp = -1;
    $(document).keypress(handleKeyPress);

    function handleKeyPress(e) {
        if (timeStamp === -1) {
            timeStamp = new Date().getTime();
        }
        
        var charCode = (typeof e.which == "number") ? e.which : e.keyCode;

        var char = String.fromCharCode(charCode);
        
        if (content.charAt(cursorIndex) === char) {
            contentStyleMap[cursorIndex] = CharStyling.CORRECT;
        } else {
            contentStyleMap[cursorIndex] = CharStyling.WRONG;
        }
        cursorIndex += 1;
        

        if (cursorIndex >= content.length) {
            var timeDelta = new Date().getTime() - timeStamp;
            alert("You took " + timeDelta / 1000 + "s");
            $(document).unbind('keypress', handleKeyPress);
            var nextElem = nextTest($(elem), 15);
            reset(elem, content);
            if (nextElem) {
                start(nextElem);
            }
        } else {
            contentStyleMap[cursorIndex] = CharStyling.CURSOR;
            renderText(elem, content, contentStyleMap);
        }
        return false;
    }
}

function nextTest(elem, n) {
    console.log('nextTest', elem.html(), n);
    if (n <= 0) {
        return false;
    }
    var sibling = firstSiblingTextNode(elem);
    if (!sibling) {
        console.log("!sibling");
        sibling = nextTest($(elem).parent(), n-1);
        // 
        // if ($(elem).parent().next().length) {
        //     sibling = firstChildTextNode($(elem).parent().next());
        //     console.log('nextTest parent', sibling.html());
        //     if (!sibling) {
        //         sibling = nextTest($(elem).parent(), n-1);
        //     }
        // }
        if (!sibling) {
            var cousins = elem.next().contents();
            for (var i = 0; i<cousins.length; i++) {
                sibling = firstChildTextNode(cousins[i]);
                //sibling = nextTest(cousins[i], n-1);
                if (sibling) {
                    return sibling;
                }
            }
        }
    }
    return sibling;
}

function firstChildTextNode(elem) {
    var contents = $(elem).contents();
    for (var i = 0; i < contents.length; i++) {
        var child = contents[i];
        if (child.nodeType === 3 && $(child).text().trim().length >= 1) {
            return child;
        }
    }
    return false;
}

function firstSiblingTextNode(elem) {
    var node = $(elem.get().nextSibling);
    console.log('firstSiblingTextNode', elem.get().tagName, node.html());
    var count = 0;
    while(node && count < 10) {
        count ++;
        var textNode = firstChildTextNode(node);
        if (textNode) {
            return textNode;
        }
        node = node.next();
    }
    return false;
}


var prevElem;
var backupClass;

function highlightTextNodes(e) {
    var elem = firstChildTextNode(
        document.elementFromPoint(e.clientX, e.clientY));
    
    if (elem && !Object.is(prevElem, elem)) {
        if (prevElem) {
            $(prevElem).unwrap();
        }
        $(elem).wrap("<span class='ttw-selected'></span>");
        prevElem = elem;
    }
}

function setupTest(e) {
    var elem = firstChildTextNode(
        document.elementFromPoint(e.clientX, e.clientY));
    if (elem) {
        $(document).unbind("mousemove", highlightTextNodes);
        $(document).unbind("click", setupTest);
        
        $(elem).unwrap(); // it'll be wrapped in a span from the mousemove
        start(elem);
        return false;
    }
    return true;
}
    
$(document).mousemove(highlightTextNodes);
$(document).click(setupTest);
