var CharStyle = {
    COR: styleCorrect,
    WRG: styleWrong,
    CUR: styleCursor,
    DEF: R.identity
};

var BURST_TIME = 10; // burst wpm time interval in seconds
var WORD_LENGTH = 5; // chars per word

function styleCursor(text) {
    return "<span class='ttw-typed' id='ttw-cursor'>" + text + "</span>";
}

function styleWrong(text) {
    return "<span class='ttw-typed ttw-wrong'>" + text + "</span>";
}

function styleCorrect(text) {
    return "<span class='ttw-typed ttw-correct'>" + text + "</span>";
}


function HudStats() {
    this.startTime = -1;
    this.currentTime = -1;
    this.keysBurst = [];
    this.keysTyped = 0;
    this.errorsTyped = 0;
    
    this.timeSoFar = function() {
        return this.currentTime - this.startTime;
    };
    
    this.updateStartTime = function() {
        if (this.startTime === -1) {
            this.startTime = this.currentTime;
        }
    };
    
    this.updateKeysBurst = function () {
        this.keysBurst =  R.appendTo(R.filter(R.lt(this.currentTime - BURST_TIME * 1000),
                                              this.keysBurst),
                                     this.currentTime);
    };
    
    this.keyPressed = function() {
        this.updateKeysBurst(this.keysBurst, this.currentTime);
        this.keysTyped += 1;
    };
}

function ContentData(element, originalText) {
    this.element = element;
    this.originalText = originalText;
    this.contentStyle = R.concat([CharStyle.CUR], R.repeatN(CharStyle.DEF, this.originalText.length-1));
    this.cursorIdx = 0;
    
    this.charAtCursor = function() {
        return this.originalText[this.cursorIdx];
    };
    
    this.setCursorStyle = function(style) {
        this.contentStyle[this.cursorIdx] = style;
    };
    
    this.incCursor = function() {
        this.cursorIdx += 1;
    };

    this.doneTyping = function() {
        return this.cursorIdx >= this.originalText.length;
    };
    
    this.resetElement = function() {
        $(this.element).html(this.originalText);
        var textNode = $(this.element).contents()[0];
        $(textNode).unwrap(); // remove the enclosing span tags
        this.element = textNode;
    };
    
    this.renderText = function () {
        function styleLetter(accTriple, pair) {
            var [result, run, prevStyle] = accTriple;
            var [letter, style] = pair;
            return prevStyle === style ?
                [result, R.concat(run, letter), style] :
                [R.concat(result, prevStyle(run)), letter, style];
        }
        
        var [firstChar, firstStyle] = [this.originalText[0], this.contentStyle[0]];
        var [tailChars, tailStyles] = [R.tail(this.originalText), R.tail(this.contentStyle)];
        var [result, run, prevStyle] = R.foldl(styleLetter,
                                               ["", firstChar, firstStyle],
                                               R.zip(tailChars, tailStyles));

        var styledContent = R.concat(result, prevStyle(run));
        $(this.element).html(styledContent);
    };
}

var invalidKey = R.anyPredicates([R.prop('defaultPrevented'),
                                  R.prop('ctrlKey'),
                                  R.prop('altKey'),
                                  R.prop('metaKey')]);

function createKeyHandler(contentData, unbindHandlers) {
    var hudStats = new HudStats();
    
    function handleKeyPress(e) {
        if (invalidKey(e)) {
            return;
        }
        switch(e.key) {
        case "Esc":
            stop(contentData, unbindHandlers);
            return;
        case "Tab":
            nextElem(contentData, unbindHandlers);
            e.preventDefault();
            return;
        }
        hudStats.currentTime = new Date().getTime();
        hudStats.updateStartTime();
        hudStats.keyPressed();// var ERROR_PENALTY = 0.5; // how many wpm to take off for every error

        
        var charCode = (typeof e.which === "number") ? e.which : e.keyCode;
        var typedChar = String.fromCharCode(charCode);
        var which = String.fromCharCode(e.which);
        var keyCode = String.fromCharCode(e.keyCode);
        console.log("keyCode:", "'",e.which, "'", "'", e.keyCode, "'", e.charCode, "'", which, "'", keyCode, "'");
        
        var cursorChar = contentData.charAtCursor();
        
        var charStyle;
        if (cursorChar === typedChar) {
            charStyle = CharStyle.COR;
        } else {
            charStyle = CharStyle.WRG;
            hudStats.errorsTyped += 1;
        }
        contentData.setCursorStyle(charStyle);
        contentData.incCursor();
        
        if (contentData.doneTyping()) {
            alert("You took " + hudStats.timeSoFar() / 1000 + "s");
            nextElem(contentData, unbindHandlers);
        } else {
            contentData.setCursorStyle(CharStyle.CUR);
            contentData.renderText();
            setHUDText(hudStats);
        }
        e.preventDefault();
    }
    contentData.renderText();
    return handleKeyPress;
}


function nextElem(contentData, unbindHandlers) {
    console.log('next button pressed');
    unbindHandlers();
    contentData.resetElement();
    var nextElem = nextTextElement(contentData.element);
    if (nextElem) {
        startTyping(nextElem);
    }
}

function stop(contentData, unbindHandlers) {
    console.log('stop button pressed');
    unbindHandlers();
    contentData.resetElement();
    killHUD();
}

function startTyping(elem) {
    $(elem).wrap("<span class='ttw'></span>");
    function unbindHandlers() {
        $(document).unbind('keypress', handleKeyPress);
        $('#ttw-skip-button').unbind('click', skipButtonHandler);
        $('#ttw-stop-button').unbind('click', stopButtonHandler);
    }
    var contentData = new ContentData($(elem).parent(), elem.nodeValue);
    var handleKeyPress = createKeyHandler(contentData, unbindHandlers);
    $(document).keypress(handleKeyPress);
    
    function stopButtonHandler(e) {
        stop(contentData, unbindHandlers);
    }
    
    function skipButtonHandler(e) {
        nextElem(contentData, unbindHandlers);
        $('#ttw-skip-button').blur();
    }
    
    $("#ttw-stop-button").click(stopButtonHandler);
    $("#ttw-skip-button").click(skipButtonHandler);
}

function findAllTextNodes() {
    var textNodes = (function recurse(accum, node) {     
        if (node.hasChildNodes()) {
            R.map(R.curry(recurse)(accum), node.childNodes);
        } else if (node.nodeType == 3 && node.nodeValue.trim().length) {
            accum.push(node);
        }
        return accum;
    })([], $('body')[0]);
    return textNodes;
}

function nextTextElement(elem) {
    var textNodes = findAllTextNodes();
    var index = R.indexOf(elem, textNodes);
    return index === -1 && index < textNodes.length-1?
        false :
        textNodes[index + 1];
}

function firstChildTextNode(elem) {
    var notWhiteSpace = R.pipe(R.trim, R.not(R.isEmpty));

    function notWhitespace(string) {
        return string.trim().length >= 1;
    }
    
    
    var textNodes = R.filter(R.and(R.propEq('nodeType', 3),
                                   R.pipe(R.prop('nodeValue'), 
                                          notWhiteSpace)),
                             elem.childNodes);
    
    var maybeTextNode = R.ifElse(R.isEmpty,
                                 R.alwaysFalse,
                                 R.head);
    return maybeTextNode(textNodes);
}

function setHUDText(hudStats) {
    var timeSec = hudStats.timeSoFar() / 1000;
    var numCharsBurst = hudStats.keysBurst.length;
    var burstwpm = Math.floor(numCharsBurst / WORD_LENGTH / BURST_TIME * 60);
    var wpm = Math.floor(
        hudStats.keysTyped / WORD_LENGTH / timeSec * 60 - hudStats.errorsTyped / WORD_LENGTH);
    
    var wordsTyped = Math.floor(hudStats.keysTyped / 5);
    var text =
        "<div id='ttw-hud'>\
           <div class='ttw-hud-stat'>\
               <div class='ttw-inline' id='ttw-hud-num'>"+wordsTyped+"</div>\
               <div class='ttw-hud-text'>words typed</div>\
           </div>\
           <div class='ttw-hud-stat'>\
               <div class='ttw-inline' id='ttw-hud-num'>"+hudStats.errorsTyped+"</div>\
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
        
        R.forEach(
            function(element) {
                var child = element.childNodes[0]; // there will be only one child since only textnodes are selected
                var parent = element.parentNode;
                parent.parentNode.replaceChild(child, parent);
            },
            document.getElementsByClassName("ttw-selected"));
        
        initHUD();
        startTyping(textNode);
        return false;
    }
    return true;
}



function createTextNodeHighlighter() {
    var prevElem;
    function highlightTextNodes(e) {
        var elem = firstChildTextNode(
            document.elementFromPoint(e.clientX, e.clientY));
        
        if (!Object.is(prevElem, elem)) {
            if (prevElem) {
                $(prevElem).unwrap();
                prevElem = undefined;
            }
            if (elem) {
                $(elem).wrap("<span class='ttw-selected'></span>");
                prevElem = elem;
            }
        }
    }
    return highlightTextNodes;
}
var highlightTextNodes = createTextNodeHighlighter();
    
$(document).mousemove(highlightTextNodes);
$(document).click(setupTest);
