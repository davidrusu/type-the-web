let CharStyle = { COR: styleCorrect
                , WRG: styleWrong
                , CUR: styleCursor
                , DEF: R.identity
                };

let BURST_TIME = 10; // burst wpm time interval in seconds
let WORD_LENGTH = 5; // chars per word

function styleCursor(text) {
    return $("<span class='ttw-typed' id='ttw-cursor'></span>").text(text)[0].outerHTML;
}

function styleWrong(text) {
    return $("<span class='ttw-typed ttw-wrong'></span>").text(text)[0].outerHTML;
}

function styleCorrect(text) {
    return $("<span class='ttw-typed ttw-correct'></span>").text(text)[0].outerHTML;
}

function HudStats() {
    this.startTime = -1;
    this.currentTime = -1;
    this.keysBurst = [];
    this.keysTyped = 0;
    this.errorsTyped = 0;
    
    this.timeSoFar = () => this.currentTime - this.startTime;
    
    this.updateStartTime = () => {
        if (this.startTime === -1) {
            this.startTime = this.currentTime;
        }
    };

    this.updateKeysBurst = () => {
        this.keysBurst =  R.appendTo(R.filter(R.lt(this.currentTime - BURST_TIME * 1000),
                                              this.keysBurst),
                                     this.currentTime);
    };

    this.keyPressed = () => {
        this.updateKeysBurst(this.keysBurst, this.currentTime);
        this.keysTyped += 1;
    };
}

function ContentData(element, originalText) {
    this.element = element;
    this.originalText = originalText;
    this.contentStyle = R.concat([CharStyle.CUR], R.repeatN(CharStyle.DEF, this.originalText.length-1));
    this.cursorIdx = 0;
    
    this.charAtCursor = () => this.originalText[this.cursorIdx];
    
    this.setCursorStyle = (style) => {
        if (this.doneTyping()) return;
        this.contentStyle[this.cursorIdx] = style;
    };
    
    this.incCursor = () => {
        this.cursorIdx += 1;
    };

    this.backspace = () => {
        if (this.cursorIdx === 0) {
            return;
        }
        this.setCursorStyle(CharStyle.DEF);
        this.cursorIdx -= 1;
        this.setCursorStyle(CharStyle.CUR);
    };

    this.doneTyping = () => this.cursorIdx >= this.originalText.length;
    
    this.resetElement = () => {
        $(this.element).text(this.originalText);
        let textNode = $(this.element).contents()[0];
        $(textNode).unwrap(); // remove the enclosing span tags
        this.element = textNode;
    };
    
    this.renderText = () => {
        let styleLetter = (accTriple, pair) => {
            let [result, run, prevStyle] = accTriple;
            let [letter, style] = pair;
            return prevStyle === style ?
                [result, R.concat(run, letter), style] :
                [R.concat(result, prevStyle(run)), letter, style];
        };
        
        let [firstChar, firstStyle] = [this.originalText[0], this.contentStyle[0]];
        let [tailChars, tailStyles] = [R.tail(this.originalText), R.tail(this.contentStyle)];
        let [result, run, prevStyle] = R.foldl(styleLetter,
                                               ["", firstChar, firstStyle],
                                               R.zip(tailChars, tailStyles));
        
        let styledContent = R.concat(result, prevStyle(run));
        $(this.element).html(styledContent);
    };
}

let invalidKey = R.anyPredicates([R.prop('defaultPrevented'),
                                  R.prop('ctrlKey'),
                                  R.prop('altKey'),
                                  R.prop('metaKey')]);

function createKeyHandler(contentData, unbindHandlers) {
    let hudStats = new HudStats();
    let handleKeyPress = (e) => {
        if (invalidKey(e)) return;
        
        switch(e.key) {
        case "Esc":
            stop(contentData, unbindHandlers);
            return;
        case "Tab":
            nextElem(contentData, unbindHandlers);
            e.preventDefault();
            return;
        case "Backspace":
            contentData.backspace();
            setHUDText(hudStats);
            contentData.renderText();
            e.preventDefault();
            return;
        }
        
        hudStats.currentTime = new Date().getTime();
        hudStats.updateStartTime();
        hudStats.keyPressed();

        let charCode = (typeof e.which === "number") ? e.which : e.keyCode;
        let typedChar = String.fromCharCode(charCode);
        let cursorChar = contentData.charAtCursor();
        
        let charStyle;
        if (cursorChar === typedChar) {
            charStyle = CharStyle.COR;
        } else {
            charStyle = CharStyle.WRG;
            hudStats.errorsTyped += 1;
        }
        contentData.setCursorStyle(charStyle);
        contentData.incCursor();
        
        contentData.setCursorStyle(CharStyle.CUR);
        setHUDText(hudStats);
        if (contentData.doneTyping()) {
            nextElem(contentData, unbindHandlers);
        } else {
            contentData.renderText();
        }
        e.preventDefault();
    };
    
    return handleKeyPress;
}


function nextElem(contentData, unbindHandlers) {
    unbindHandlers();
    contentData.resetElement();
    var nextElem = nextTextElement(contentData.element);
    if (nextElem) {
        startTyping(nextElem);
    }
}

function stop(contentData, unbindHandlers) {
    unbindHandlers();
    contentData.resetElement();
    killHUD();
}

function startTyping(elem) {
    $(elem).wrap("<span class='ttw'></span>");
    let unbindHandlers = () => {
        $(document).unbind('keypress', handleKeyPress);
        $('#ttw-skip-button').unbind('click', skipButtonHandler);
        $('#ttw-stop-button').unbind('click', stopButtonHandler);
    };
    
    let contentData = new ContentData($(elem).parent(), elem.nodeValue);
    let handleKeyPress = createKeyHandler(contentData, unbindHandlers);
    contentData.renderText();
    
    $(document).keypress(handleKeyPress);
    
    let stopButtonHandler = (e) => {
        stop(contentData, unbindHandlers);
    };
    
    let skipButtonHandler = (e) => {
        nextElem(contentData, unbindHandlers);
        $('#ttw-skip-button').blur();
    };
    
    $("#ttw-stop-button").click(stopButtonHandler);
    $("#ttw-skip-button").click(skipButtonHandler);
}

function findAllTextNodes() {
    let recurse = R.curry((accum, node) => {     
        if (node.hasChildNodes()) {
            R.map(recurse(accum), node.childNodes);
        } else if (node.nodeType == 3 && node.nodeValue.trim().length) {
            accum.push(node);
        }
        return accum;
    });
    var textNodes = recurse([], $('body')[0]);
    return textNodes;
}

function nextTextElement(elem) {
    var textNodes = findAllTextNodes();
    var index = R.indexOf(elem, textNodes);
    return index === -1 && index < textNodes.length-1?
        false :
        textNodes[index + 1];
}

function firstTextNode(elem) {
    var notWhiteSpace = R.pipe(R.trim, R.not(R.isEmpty));

    function notWhitespace(string) {
        return string.trim().length >= 1;
    }
    
    
    var textNodes = R.filter(R.and(R.propEq('nodeType', 3),
                                   R.pipe(R.prop('nodeValue'), 
                                          notWhiteSpace)),
                             elem.childNodes);
    
    var maybeTextNode = R.ifElse(R.isEmpty,
                                 R.always(undefined),
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
    var textNode = firstTextNode(
        document.elementFromPoint(e.clientX, e.clientY));
    if (textNode) {
        $(document).unbind("mousemove", highlightTextNodes);
        $(document).unbind("click", setupTest);
        
        R.forEach(
            function(element) {
                var child = element.childNodes[0];
                var parent = element.parentNode;
                parent.replaceChild(child, element);
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
    return (e) => {
        let elem = firstTextNode(
            document.elementFromPoint(e.clientX, e.clientY));

        if (elem === undefined || Object.is(prevElem, elem)) return;
        
        if (prevElem) {
            $(prevElem).unwrap();
        }
        
        $(elem).wrap("<span class='ttw-selected'></span>");
        prevElem = elem;
    };
}
var highlightTextNodes = createTextNodeHighlighter();
    
$(document).mousemove(highlightTextNodes);
$(document).click(setupTest);
