// This is the styles we will be applying to the text
// as they are typed
const CharStyle = Object.freeze({ COR: "COR"
                                , WRG: "WRG"
                                , CUR: "CUR"
                                , DEF: "DEF"
                                });

let pastContentData = []; // we keep a list so that we can reset the elements when done
let contentData; // set when the user selects a block of text
let nextElement; // the text node to be typed

const handleKeyPress = createKeyHandler();
                            
const unbindHandlers = () => {
    $(document).unbind("mousemove", highlightTextNodes);
    $(document).unbind("click", setupTest);
    $(document).unbind('keypress', handleKeyPress);
};

let invalidKey = R.anyPredicates([R.prop('ctrlKey'),
                                  R.prop('altKey'),
                                  R.prop('metaKey')]);
function getCharFromKeyEvent(e) {
    let charCode = (typeof e.which === "number") ? e.which : e.keyCode;
    return String.fromCharCode(charCode);
}

function createKeyHandler() {
    let hudStats = new HudStats();
    return (e) => {
        if (invalidKey(e)) return;

        // remove any highlighting before processing key event
        R.forEach((e) => e.parentNode.replaceChild(e.childNodes[0], e),
                  document.getElementsByClassName("ttw-selected"));

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
            if (contentData.isCursorIdxNegative()) {
                prevElem();
            } else {
                setHUDText(hudStats);
                contentData.renderText();
            }
            break;
        default:
            let typedChar = getCharFromKeyEvent(e);
            let cursorChar = contentData.charAtCursor();
            let typedIncorrect = () => !(typedChar === cursorChar || (CharMap[cursorChar] && R.contains(typedChar, CharMap[cursorChar])));
            let typedWhiteSpace = () => CharMap[' '] && R.contains(typedChar, CharMap[' ']);
            let isTypingFirstChar = contentData.cursorIdx == 0;
            if (isTypingFirstChar && typedIncorrect() && typedWhiteSpace()) {
                return;// We ignore wrong whitespace at the start of a block
            }
            hudStats.newKeyEvent(e, contentData);
            setHUDText(hudStats);
            contentData.incCursor();
            contentData.renderText();
            if (contentData.doneTyping()) {
                nextElem();
            }
        }
    };
}

function HudStats() {
    this.startTime = -1;
    this.currentTime = -1;
    this.keysBurst = [];
    this.errorsBurst = [];
    this.keysTyped = 0;
    this.errorsTyped = 0;
    
    this.timeSoFar = () => this.currentTime - this.startTime;
    
    this.updateStartTime = () => {
        if (this.startTime === -1) {
            this.startTime = this.currentTime;
        }
    };

    this.updateKeysBurst = () => {
        this.keysBurst = R.appendTo(R.filter((x) => this.currentTime - CONSTANTS.BURST_TIME * 1000 < x,
                                             this.keysBurst),
                                     this.currentTime);
    };

    this.updateErrorsBurst = () => {
	this.errorsBurst = R.filter(R.lt(this.currentTime - CONSTANTS.BURST_TIME * 1000)
				    , this.errorsBurst);
    };

    this.keyPressed = () => {
        this.updateKeysBurst();
        this.updateErrorsBurst();
        this.keysTyped += 1;
    };

    this.errorTyped = () => {
        this.errorsTyped += 1;
        this.errorsBurst = R.appendTo(this.errorsBurst, this.currentTime);
    };

    /** Updates the statistics given the new key event */
    this.newKeyEvent = (e, contentData) => {
        this.currentTime = new Date().getTime();
        this.updateStartTime();
        this.keyPressed();

        let typedChar = getCharFromKeyEvent(e);
        
        let cursorChar = contentData.charAtCursor();
        if (cursorChar === typedChar ||
            (CharMap[cursorChar] && R.contains(typedChar, CharMap[cursorChar]))) {
            contentData.setCursorCorrect();
        } else {
            contentData.setCursorWrong();
	    this.errorTyped();
        }
    };

    /** converts the object into a serializeable form */
    this.serialize = () => {
        let clone = R.cloneDeep(this);
        clone.timeSoFar = this.timeSoFar();
        return clone;
    };
}

function preprocess(text) {
    let changed = true;
    let result = text;
    while (changed) {
	changed = false;
	for (let k in ReplaceMap) {
	    let replaced = result.replace(k, ReplaceMap[k]);
	    if (replaced !== result) {
		result = replaced;
		changed = true;
	    }
	}
    }
    return result;
}

function ContentData(element, originalText) {
    this.element = element;
    this.originalText = originalText; // the unmodified text from the TextNode we are typing.
    this.processedText = preprocess(originalText);
    this.styleMap = R.concat([CharStyle.CUR], R.repeatN(CharStyle.DEF, this.processedText.length-1));
    this.cursorIdx = 0;
    
    this.charAtCursor = () => this.processedText[this.cursorIdx];
    
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
	if (!this.doneTyping()) {
            this.setCursorCursor();
	}
    };

    this.backspace = () => {
        this.setCursorDefault();
        this.cursorIdx -= 1;
        this.setCursorCursor();
    };

    this.isCursorIdxNegative = () => this.cursorIdx < 0;
        
    this.doneTyping = () => this.cursorIdx >= this.processedText.length;
    
    this.resetElement = () => {
        $(this.element).text(this.originalText);
        let textNode = $(this.element).contents()[0];
        $(textNode).unwrap(); // remove the enclosing span tags
        this.element = textNode;
    };
    
    this.renderText = () => {
	$(this.element).text("");
        let prevStyle = this.styleMap[0];
        let run = this.processedText[0];
        for (let [c, style] of R.tail(R.zip(this.processedText, this.styleMap))) {
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

	let cursor = $("#ttw-cursor");
	if (cursor.length > 0) {
	    $('html, body').animate({
		scrollTop: Math.round((cursor.offset().top - 100) / 15) * 15
	    }, 100);
	}
    };
}

function getSpan(style) {
    let span;
    switch (style) {
    case CharStyle.COR: span = $("<span class='ttw-typed ttw-correct'></span>"); break;
    case CharStyle.WRG: span = $("<span class='ttw-typed ttw-wrong'></span>"); break;
    case CharStyle.CUR: span = $("<span id='ttw-cursor'></span>"); break;
    case CharStyle.DEF: span = $("<span class='ttw-untyped'></span>"); break;
    }
    return span;
}

function createContentData(element) {
    $(element).wrap("<span class='ttw'></span>");
    return new ContentData($(element).parent(), element.nodeValue);
}
function nextElem() {
    let contentDataIdx = pastContentData.indexOf(contentData);
    stop();

    if (contentDataIdx != -1 && pastContentData.length - 1 > contentDataIdx) {
        // In this case, we were in a block of text that we had previously typed,
        // Therefore we must have started another block further down and it's
        // contennntData is stored in pastContentData.
        let nextContentData = pastContentData[contentDataIdx + 1];
        nextContentData.incCursor();
        startTyping(nextContentData);
    } else {
        // startTyping will modify the nextElement node
        // so we have to find the next nextElement before
        // calling startElement
        let newElement = nextTextElement(nextElement); 
        if (nextElement) {
            startTyping(createContentData(nextElement));
        } else {
            // There is no more content to type
            // but we don't call finish because 
            // we want to preserve the 
            // highlighting of the errors
        }
        nextElement = newElement;
    }
}

function prevElem() {
    let contentDataIdx = pastContentData.indexOf(contentData);
    if (contentDataIdx == 0 || pastContentData.length == 0) {
        // This happens when the cursor is at the first character of the
        // first block of text
        //
        // we keep using the existing contentData
        contentData.incCursor();// contentData was decremented before we were called
    } else { // We know (contentDataIdx == -1 || contentDataIdx > 0) && pastContentData.length != 0
        // This case happens when the user hasn't previously finished typing this contentData
        let idx = pastContentData.length -1;
        if (contentDataIdx != -1) {
            idx = contentDataIdx - 1;
        }
        let prevContentData = pastContentData[idx];
        stop();
        if (prevContentData.doneTyping()) {
            prevContentData.backspace();
            // we only backspace if the user has typed all of the text in the previous block
        }
        startTyping(prevContentData);
    }
}

function finish() {
    stop();
    pastContentData.forEach((cd) => cd.resetElement());
    pastContentData = [];
}

function stop() {
    unbindHandlers();
    R.forEach((e) => e.parentNode.replaceChild(e.childNodes[0], e),
              document.getElementsByClassName("ttw-selected"));
    $('#ttw-cursor').removeAttr('id');
    if (contentData && pastContentData.indexOf(contentData) === -1) {
        pastContentData.push(contentData);
    }
}

function startTyping(_contentData) {
    contentData = _contentData;
    contentData.renderText();
    
    $(contentData.element).wrap("<span class='ttw-selected ttw'></span>");

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
    let textNodes = recurse([], $('body')[0]);
    return textNodes;
}

function nextTextElement(elem) {
    let textNodes = findAllTextNodes();
    let index = R.indexOf(elem, textNodes);
    
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
    let textNode = firstTextNode(
        document.elementFromPoint(e.clientX, e.clientY));
    nextElement = nextTextElement(textNode);

    if (textNode === undefined) return;

    stop();
    startTyping(createContentData(textNode)
);
}

$(document).click(setupTest);

/** need to have a reference to this handler for when we unbind */
let highlightTextNodes = (() => {
    let prevElem;
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

self.port.on('stop', finish);
self.port.on('skip', nextElem);
