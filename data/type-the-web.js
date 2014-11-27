var CharStyle = {
    COR: styleCorrect,
    WRG: styleWrong,
    CUR: styleCursor,
    DEF: R.identity
};

var BURST_TIME = 10; // burst wpm time interval in seconds
var WORD_LENGTH = 5; // chars per word
// var ERROR_PENALTY = 0.5; // how many wpm to take off for every error

function styleCursor(text) {
    return "<span class='ttw-typed' id='ttw-cursor'>" + text + "</span>";
}

function styleWrong(text) {
    return "<span class='ttw-typed ttw-wrong'>" + text + "</span>";
}

function styleCorrect(text) {
    return "<span class='ttw-typed ttw-correct'>" + text + "</span>";
}

// content / contentStyle is assumed to be non empty
function renderText(elem, content, contentStyle) {
    var result = "";
    var run = content.charAt(0);
    var prevStyle = contentStyle[0];
    
    for (var i = 1; i < contentStyle.length; i++) {
        var charStyle = contentStyle[i];
        if (prevStyle != charStyle) {
            result += prevStyle(run);
            prevStyle = charStyle;
            run = "";
        }
        run += content.charAt(i);
    }
    
    result += prevStyle(run);
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

function createKeyHandler(spanElem, content, unbindHandlers) {
    var startTime = -1;
    var keysBurst = [];
    var keysTyped = 0;
    var errorsTyped = 0;
    var contentStyleMap = R.repeatN(CharStyle.DEF, content.length);
    var cursorIdx = 0;
    contentStyleMap[cursorIdx] = CharStyle.CUR;
    function handleKeyPress(e) {
        var currentTime = new Date().getTime();
        if (startTime === -1) {
            startTime = currentTime;
        }
        var testTime = currentTime - startTime;

        keysBurst.push(testTime);
        keysBurst = R.filter(R.lt(testTime - BURST_TIME * 1000), keysBurst);
        keysTyped += 1;
        
        var charCode = (typeof e.which === "number") ? e.which : e.keyCode;
        var typedChar = String.fromCharCode(charCode);
        var cursorChar = content.charAt(cursorIdx);
        
        var charStyle;
        if (cursorChar === typedChar) {
            charStyle = CharStyle.COR;
        } else {
            charStyle = CharStyle.WRG;
            errorsTyped += 1;
        }
        contentStyleMap[cursorIdx] = charStyle;
        
        cursorIdx += 1;
        if (cursorIdx >= content.length) {
            alert("You took " + testTime / 1000 + "s");
            nextElem(spanElem, content, unbindHandlers);
        } else {
            contentStyleMap[cursorIdx] = CharStyle.CUR;
            renderText(spanElem, content, contentStyleMap);
            setHUDText(keysTyped, errorsTyped, keysBurst, testTime);
        }
        return false;
    }
    
    renderText(spanElem, content, contentStyleMap);
    return handleKeyPress;
}


function nextElem(spanElem, content, unbindHandlers) {
    console.log('next button pressed');
    unbindHandlers();
    var node = reset(spanElem, content);
    var nextElem = nextTextElement(node);
    if (nextElem) {
        startTyping(nextElem);
    }
}

function startTyping(elem) {
    var content = elem.nodeValue;

    $(elem).wrap("<span class='ttw'></span>");
    var spanElem = $(elem).parent();

    function unbindHandlers() {
        $(document).unbind('keypress', handleKeyPress);
        $('#ttw-skip-button').unbind('click', skipButtonHandler);
        $('#ttw-stop-button').unbind('click', stopButtonHandler);
    }
    
    var handleKeyPress = createKeyHandler(spanElem, content, unbindHandlers);
    $(document).keypress(handleKeyPress);
    
    function stopButtonHandler(e) {
        console.log('stop button pressed');
        unbindHandlers();
        reset(spanElem, content);
        killHUD();
    }
    
    function skipButtonHandler(e) {
        nextElem(spanElem, content, unbindHandlers);
    }
    
    
    $("#ttw-stop-button").click(stopButtonHandler);
    $("#ttw-skip-button").click(skipButtonHandler);
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

function firstChildTextNode(elem) {
    var notWhiteSpace = R.pipe(R.trim, R.not(R.isEmpty));
    
    var textNodes = R.filter(R.and(R.propEq('nodeType', 3),
                                   R.pipe(R.prop('nodeValue'), 
                                          notWhiteSpace)),
                             elem.childNodes);
    
    var maybeTextNode = R.ifElse(R.isEmpty,
                                 R.alwaysFalse,
                                 R.head);
    
    return maybeTextNode(textNodes);
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

function setHUDText(numTyped, numErrors, keysBurst, time) {
    var timeSec = time / 1000;
    var numCharsBurst = keysBurst.length;
    var burstTime = (time - keysBurst[0]) / 1000;
    
    var burstwpm = Math.floor(numCharsBurst / WORD_LENGTH / burstTime * 60);
    var wpm = Math.floor(
        numTyped / WORD_LENGTH / timeSec * 60 - numErrors / WORD_LENGTH);
    
    console.log(numTyped, numCharsBurst, timeSec, burstTime, burstwpm, wpm);
    var wordsTyped = Math.floor(numTyped / 5);
    var text =
        "<div id='ttw-hud'>\
           <div class='ttw-hud-stat'>\
               <div class='ttw-inline' id='ttw-hud-num'>"+wordsTyped+"</div>\
               <div class='ttw-hud-text'>words typed</div>\
           </div>\
           <div class='ttw-hud-stat'>\
               <div class='ttw-inline' id='ttw-hud-num'>"+numErrors+"</div>\
               <div class='ttw-hud-text'>errors</div>\
           </div>\
           <div class='ttw-hud-stat'>\
               <div class='ttw-inline' id='ttw-hud-num'>"+burstwpm+"</div>\
               <div class='ttw-hud-text'>burst wpm</div>\
           </div>\
           <div class='ttw-hud-stat'>\
               <div class='ttw-inline' id='ttw-hud-num'>"+wpm+"</div>\
               <div class='ttw-hud-text'>wpm</div>\
           </div>\
        </div>";
    $("#ttw-stats").html(text);
}

function initHUD() {
    $("<div id='ttw-hud'>\
         <div id='ttw-stats'></div>\
         <div id='ttw-buttons'>\
           <button id='ttw-skip-button' class='btn btn-primary'>Skip</button>\
           <button id='ttw-stop-button' class='btn btn-danger'>Stop</button>\
         </div>\
       </div>").appendTo("body");
    setHUDText(0,0,0,0);
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
        startTyping(textNode);
        return false;
    }
    return true;
}
    
$(document).mousemove(highlightTextNodes);
$(document).click(setupTest);
