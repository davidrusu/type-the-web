// This is the styles we will be applying to the text
// as they are typed
const CharStyle = { COR: (text) => $("<span class='ttw-typed ttw-correct'></span>").text(text)[0].outerHTML
                , WRG: (text) => $("<span class='ttw-typed ttw-wrong'></span>").text(text)[0].outerHTML
                , CUR: (text) => $("<span class='ttw-typed' id='ttw-cursor'></span>").text(text)[0].outerHTML
                , DEF: R.identity
                };

let contentData = undefined; // set when the user selects a block of text

const handleKeyPress = createKeyHandler();

const unbindHandlers = () => {
    $(document).unbind("mousemove", highlightTextNodes);
    $(document).unbind("click", setupTest);
    $(document).unbind('keypress', handleKeyPress);
};



let invalidKey = R.anyPredicates([R.prop('ctrlKey'),
                                  R.prop('altKey'),
                                  R.prop('metaKey')]);

function createKeyHandler() {
    let hudStats = new HudStats();
    return (e) => {
        if (invalidKey(e)) return;

        e.preventDefault();
        switch(e.key) {
        case "Esc":
            self.port.emit('stopping');
            break;
        case "Tab":
            nextElem();
            break;
        case "Backspace":
            contentData.backspace();
            setHUDText(hudStats);
            contentData.renderText();
            break;
        default:
            let charStyle = hudStats.newKeyEvent(e, contentData.charAtCursor());
            setHUDText(hudStats);
            
            contentData.setCursorStyle(charStyle);
            contentData.incCursor();
            if (contentData.doneTyping()) {
                nextElem();
            } else {
                contentData.renderText();
            }
        }
    };
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
        this.keysBurst =  R.appendTo(R.filter(R.lt(this.currentTime - CONSTANTS.BURST_TIME * 1000),
                                              this.keysBurst),
                                     this.currentTime);
    };

    this.keyPressed = () => {
        this.updateKeysBurst(this.keysBurst, this.currentTime);
        this.keysTyped += 1;
    };

    /** Updates the statistics given the new key event */
    this.newKeyEvent = (e, cursorChar) => {
        this.currentTime = new Date().getTime();
        this.updateStartTime();
        this.keyPressed();
        
        let charCode = (typeof e.which === "number") ? e.which : e.keyCode;
        let typedChar = String.fromCharCode(charCode);
        
        let charStyle;
        if (cursorChar === typedChar) {
            charStyle = CharStyle.COR;
        } else {
            charStyle = CharStyle.WRG;
            this.errorsTyped += 1;
        }
        return charStyle;
    };

    /** converts the object into a serializeable form */
    this.serialize = () => {
        let clone = R.cloneDeep(this);
        clone.timeSoFar = this.timeSoFar();
        return clone;
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
        this.setCursorStyle(CharStyle.CUR);
    };

    this.backspace = () => {
        if (this.cursorIdx === 0) return;
        
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

function nextElem() {
    stop();
    var nextElem = nextTextElement(contentData.element);
    if (nextElem) {
        startTyping(nextElem);
    }
}

function stop() {
    unbindHandlers();
    R.forEach((e) => e.parentNode.replaceChild(e.childNodes[0], e),
              document.getElementsByClassName("ttw-selected"));
    if (contentData) {
        contentData.resetElement();
    }
}

function startTyping(elem) {
    $(elem).wrap("<span class='ttw'></span>");
    contentData = new ContentData($(elem).parent(), elem.nodeValue);
    contentData.renderText();
    
    $(document).keypress(handleKeyPress);
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
    
    if (index === -1 && index < textNodes.length-1) {
        return false;
    } else {
        return textNodes[index + 1];
    }
}

function firstTextNode(elem) {
    let notWhiteSpace = R.pipe(R.trim, R.not(R.isEmpty));
    let textNodes = R.filter(R.and(R.propEq('nodeType', 3),
                                   R.pipe(R.prop('nodeValue'), 
                                          notWhiteSpace)),
                             elem.childNodes);
    return R.isEmpty(textNodes) ? undefined : textNodes[0];
}

function setHUDText(hudStats) {
    self.port.emit("ttw-stats-updated", hudStats.serialize());
}

function setupTest(e) {
    e.preventDefault();
    var textNode = firstTextNode(
        document.elementFromPoint(e.clientX, e.clientY));

    if (textNode === undefined) return;

    stop();
    startTyping(textNode);
}

$(document).click(setupTest);

/** need to have a reference to this handler for when we unbind */
let highlightTextNodes = (() => {
    var prevElem;
    return (e) => {
        let elem = firstTextNode(
            document.elementFromPoint(e.clientX, e.clientY));

        if (elem === undefined || Object.is(prevElem, elem)) return;
        
        if (prevElem) {
            $(prevElem).unwrap();
        }
        
        $(elem).wrap("<span class='ttw-selected ttw'></span>");
        prevElem = elem;
    };
})();

$(document).mousemove(highlightTextNodes);

self.port.on('stop', stop);
self.port.on('skip', nextElem);
