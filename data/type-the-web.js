// This is the styles we will be applying to the text
// as they are typed
const CharStyle = Object.freeze({ COR: "COR"
                                , WRG: "WRG"
                                , CUR: "CUR"
                                , DEF: "DEF"
                                });

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
            hudStats.newKeyEvent(e, contentData);
            setHUDText(hudStats);
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
    this.newKeyEvent = (e, contentData) => {
        this.currentTime = new Date().getTime();
        this.updateStartTime();
        this.keyPressed();
        
        let charCode = (typeof e.which === "number") ? e.which : e.keyCode;
        let typedChar = String.fromCharCode(charCode);
        
        let cursorChar = contentData.charAtCursor();
        if (cursorChar === typedChar) {
            contentData.setCursorCorrect();
        } else {
            contentData.setCursorWrong();
            this.errorsTyped += 1;
        }
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
    this.originalText = originalText; // the unmodified text from the TextNode we are typing.
    // styleMap is a list of functions that will be applied to the originalText to show errors, cursor...
    // at first we have everything with a default style except for the first character which is the cursor
    this.styleMap = R.concat([CharStyle.CUR], R.repeatN(CharStyle.DEF, this.originalText.length-1));
    this.cursorIdx = 0;
    
    this.charAtCursor = () => this.originalText[this.cursorIdx];

    
    this._setCursorStyle = (style) => {
        if (this.doneTyping()) return;
        this.styleMap[this.cursorIdx] = style;
    };
    this.setCursorCorrect = () => this._setCursorStyle(CharStyle.COR);
    this.setCursorWrong = () => this._setCursorStyle(CharStyle.WRG);
    this.setCursorDefault = () => this._setCursorStyle(CharStyle.DEF);
    this.setCursorCursor = () => this._setCursorStyle(CharStyle.CUR);
    
    this.incCursor = () => {
        this.cursorIdx += 1;
        this.setCursorCursor();
    };

    this.backspace = () => {
        if (this.cursorIdx === 0) return;
        this.setCursorDefault();
        this.cursorIdx -= 1;
        this.setCursorCursor();
    };

    this.doneTyping = () => this.cursorIdx >= this.originalText.length;
    
    this.resetElement = () => {
        $(this.element).text(this.originalText);
        let textNode = $(this.element).contents()[0];
        $(textNode).unwrap(); // remove the enclosing span tags
        this.element = textNode;
    };
    
    this.renderText = () => {
	// styleMap is a list of functions, all of which are defined in the CharStyle object.
        // each function will sanitize it's input text and wrap it an span tag
        // we then concatanate these span tags into the result
	$(this.element).text(""); // clear the contents
        let prevStyle = this.styleMap[0];
        let run = this.originalText[0];
        for (let [c, style] of R.tail(R.zip(this.originalText, this.styleMap))) {
            if (style === prevStyle) {
                run += c;
            } else {
		let span = getSpan(prevStyle);
		span.text(run);
		$(this.element).append(span);
		prevStyle = style;
                run = c;
            }
        }
	let span = getSpan(prevStyle);
	span.text(run);
	$(this.element).append(span);
    };
}

function getSpan(style) {
    let span;
    switch (style) {
    case CharStyle.COR: span = $("<span class='ttw-typed ttw-correct'></span>"); break;
    case CharStyle.WRG: span = $("<span class='ttw-typed ttw-wrong'></span>"); break;
    case CharStyle.CUR: span = $("<span class='ttw-typed' id='ttw-cursor'></span>"); break;
    case CharStyle.DEF: span = $("<span></span>"); break;
    }
    return span;
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
