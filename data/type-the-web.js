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
    return $(elem).contents()[0];
}

var constant = R.curry(function(x, y) {
    return x;
});

function start(elem) {
    console.log("starting");
    var content = elem.nodeValue;//$(elem).text();
    var contentStyleMap = R.map(constant(CharStyling.UNTYPED), content);
    contentStyleMap[0] = CharStyling.CURSOR;
    
    $(elem).wrap("<span class='ttw'></span>");
    elem = $(elem).parent();
    
    
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
            var parent = $(elem).parent();
            var node = reset(elem, content);
            var nextElem = nextTextElement(node);
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

function nextTextElement(elem) {
    console.log("nextTextElement", elem.nodeValue);
    var allTextNodes = [];
    function findAllTextNodes(node) {
        if (node.hasChildNodes()) {
            R.map(findAllTextNodes, node.childNodes);
        } else if (node.nodeType == 3 && node.nodeValue.trim().length) {
            allTextNodes.push(node);
        }
    }
    findAllTextNodes($('body')[0]);
    console.log("nextTextElement", allTextNodes);
    
    var rest = R.skipUntil(R.eq(elem), allTextNodes);
    console.log("nextTextElement", rest);
    if (rest.length >= 2) {
        return rest[1];
    } else {
        return false;
    }
}

function nextTest(n, elem) {
    console.log('nextTest', n);
    if (n <= 0) {
        console.log('nextTest', 'n <= 0');
        return false;
    }

    // var textNode = firstChildTextNode(elem.contents()
    //                                   .filter(function() {
    //                                       return this != elem;
    //                                   })[0]);
    // if (textNode) {
    //     console.log('nextTest', 'contents');
    //     return textNode;
    // }
    var textNode = $(elem).next();
    console.log(textNode);
    if (textNode.length) {
        console.log('nextTest', 'next');
        return textNode;
    }
    
    textNode = firstChildTextNode(elem.parent().next()
                                  .contents()
                                  .filter(function() {
                                      return this != elem;
                                  })[0]
                                 );
    if (textNode) {
        console.log('nextTest', 'parents.next');
        return textNode;
    }

    console.log('nextTest', 'failed');
    return false;
    for (var i = 0; i < textNodes.length; i++) {
        textNode = nextTest(n-1, textNodes[i]);
        if (textNode) {
            console.log('nextTest', 'other');
            return textNode;
        }
    }
    return false;
}

//function nextTest(elem, n) {
//    console.log('nextTest', elem.html(), n);
//    if (n <= 0) {
//        return false;
//    }
//    var sibling = firstSiblingTextNode(elem);
//    if (!sibling) {
//        console.log("!sibling");
//        //sibling = nextTest($(elem).parent(), n-1);
//        if (!sibling) {
//            var cousins = $(elem).next().contents();
//            for (var i = 0; i<cousins.length; i++) {
//                sibling = firstChildTextNode(cousins[i]);
//                //sibling = nextTest(cousins[i], n-1);
//                if (sibling) {
//                    return sibling;
//                }
//            }
//        }
//         
//        if ($(elem).parent()) {
//            sibling = firstChildTextNode($(elem).parent().next());
//            if (!sibling) {
//                sibling = nextTest($(elem).parent(), n-1);
//            } else {
//                console.log('nextTest parent', $(sibling).html());
//            }
//        }
//    }
//    return sibling;
//}

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

function firstSiblingTextNode(elem) {
    var textNodes = $(elem).parent()
            .contents()
            .filter(function() {
                return this != elem;
            })
            .filter(function() {
                return this.nodeType === 3;
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

function setupTest(e) {
    var textNode = firstChildTextNode(
        document.elementFromPoint(e.clientX, e.clientY));
    if (textNode) {
        $(document).unbind("mousemove", highlightTextNodes);
        $(document).unbind("click", setupTest);
        
        $(textNode).unwrap(); // it'll be wrapped in a span from the mousemove
        console.log('starting');
        start(textNode);
        return false;
    }
    return true;
}
    
$(document).mousemove(highlightTextNodes);
$(document).click(setupTest);
