// var CharEnum = {
//     CORRECT: 0,
//     WRONG: 1,
//     CURSOR: 2,
//     UNTYPED: 3
// };

var CharStyling = {
    CORRECT: mkCorrect,
    WRONG: mkWrong,
    CURSOR: mkCursor,
    UNTYPED: function(text) { return text; } // identity func
};

function mkCursor(text) {
    console.log("mkCursor(" + text + ")");
    return "<span id='ttw-cursor'>" + text + "</span>";
}

function mkWrong(text) {
    console.log("mkWrong(" + text + ")");
    return "<span class='ttw-wrong'>" + text + "</span>";
}

function mkCorrect(text) {
    console.log("mkCorrect(" + text + ")");
    return "<span class='ttw-correct'>" + text + "</span>";
}

function renderText(elem, content, contentMap) {
    var result = "";
    var run = content.charAt(0);
    var prev = contentMap[0];
    for (var i = 1; i < contentMap.length; i++) {
        if (Object.is(contentMap[i], prev)) {
            run += content.charAt(i);
        } else {
            result += prev(run);
            prev = contentMap[i];
            run = content.charAt(i);
        }
    }
    result += prev(run);
    elem.innerHTML = result;
}

function reset(elem, backup) {
    elem.id = '';
    elem.innerHTML = backup;
}

function start() {
    var elem = document.getElementById("ttw");
    var content = elem.innerHTML;
    var contentMap = [CharStyling.CURSOR];
    for (var i = 1; i < content.length; i++) {
        contentMap.push(CharStyling.UNTYPED);
    }
    var cursorIndex = 0;
    
    renderText(elem, content, contentMap);
    
    var timeStamp = -1;
    
    document.onkeypress = function(e) {
        if (timeStamp === -1) {
            timeStamp = new Date().getTime();
        }
        
        var charCode = (typeof e.which == "number") ? e.which : e.keyCode;

        var char = String.fromCharCode(charCode);
        if (content.charAt(cursorIndex) === char) {
            contentMap[cursorIndex] = CharStyling.CORRECT;
        } else {
            contentMap[cursorIndex] = CharStyling.WRONG;
        }
        cursorIndex += 1;
        

        if (cursorIndex >= content.length) {
            var timeDelta = new Date().getTime() - timeStamp;
            alert("You took " + timeDelta / 1000 + "s");
            reset(elem, content);
        } else {
            contentMap[cursorIndex] = CharStyling.CURSOR;
            renderText(elem, content, contentMap);
        }
        return false;
    };
}
start();
