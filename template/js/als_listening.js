// @ts-ignore
var AlsListening;
(function (AlsListening) {
    var GlobalList = new Array();
    /**
     * "darkblue", "darkgreen", "darkmagenta", "darkorange", "darkred", "darkviolet"
     */
    var ColorList = ["lightcoral", "lightgreen", "lightseagreen",
        "lightpink", "goldenrod", "lightskyblue", "lightyellow",
        "cadetblue", "coral", "darkkhaki", "darkorchid", "darkgreen", "thistle"];
    var Position;
    (function (Position) {
        Position[Position["AfterHeader"] = 1] = "AfterHeader";
        Position[Position["AfterAudio"] = 2] = "AfterAudio";
    })(Position || (Position = {}));
    ;
    /**
     * <h2></h2> --Header
     * <p><audio></audio></p> --Audio
     * <pre><code></code></pre> --Text
     * <pre><code></code></pre> --NoteList
     */
    var Text = /** @class */ (function () {
        function Text(pre, code) {
            this.Pre = pre;
            this.Code = code;
            var codeClass = code.className;
            if (codeClass.startsWith("language-")) {
                this.Language = codeClass.substring(9);
            }
            else {
                this.Language = "";
            }
            this.HighlightText = this.highlight(this.unescape(this.Code.innerHTML));
        }
        Text.prototype.doHide = function () {
            this.Pre.style.display = "none";
        };
        Text.prototype.undoHide = function () {
            this.Pre.style.display = "block";
        };
        Text.prototype.reverseHide = function () {
            if (this.Pre.style.display == "none") {
                this.undoHide();
            }
            else {
                this.doHide();
            }
        };
        //highlight() should be called before coverText()
        Text.prototype.highlight = function (text) {
            var _this = this;
            var newtext = "";
            var colorMap = new Map();
            var colorIndex = 0;
            text.split("\n").forEach(function (line, index, arr) {
                if (index < arr.length - 1) {
                    line += "\n";
                }
                var name = _this.parseName(line);
                if (name == "") {
                    newtext += line;
                    return;
                }
                var color = colorMap.get(name) || "";
                if (color == "") {
                    color = ColorList[colorIndex];
                    colorMap.set(name, color);
                    colorIndex = (colorIndex + 1) % ColorList.length;
                }
                // highlight the names
                // replace() does only once by default, exactly what we need
                // Set to 90% size to avoid covering the underline of other text (the underline is created using a border).
                var newline = line.replace(name, "<span style=\"font-size: 90%;background-color: ".concat(color, ";\">").concat(name, "</span>"));
                newtext += newline;
            });
            return newtext;
        };
        /**
         * Parse a person's name based on the following characteristics:
         * 1. The name appears at the beginning of the line;
         * 2. The name contains no more than 3 spaces;
         * 3. The name is followed by a colon (:) and a space.
         */
        Text.prototype.parseName = function (line) {
            //? means non-greedy (shortest) match.
            // The name may contain special French characters, which cannot be exhaustively listed.
            var mlist = line.match(/^([^:]+): /);
            // Do not process if no match is found.
            if (mlist != null) {
                var name_1 = mlist[1];
                // Names with more than 3 spaces are not considered valid.
                var space = name_1.match(/ /g);
                if (space == null || space.length < 4) {
                    return name_1;
                }
            }
            return "";
        };
        /**
         * coverText(0) will only set the text as highlighted, without performing any replacement.
         * Words with length greater than or equal to the specified length will be replaced.
         * If the length is 0, no replacement will be performed.
         */
        Text.prototype.coverText = function (length) {
            var _this = this;
            if (length < 1) {
                this.Code.innerHTML = this.HighlightText;
                return;
            }
            var lineList = this.HighlightText.split("\n");
            lineList.forEach(function (line, i) {
                if (line.indexOf("</span>:") >= 0) {
                    var pos = line.lastIndexOf("</span>:");
                    lineList[i] = line.substring(0, pos + "</span>: ".length)
                        + _this.coverLine(line.substring(pos + "</span>: ".length), length);
                }
                else {
                    lineList[i] = _this.coverLine(line, length);
                }
            });
            this.Code.innerHTML = lineList.join("\n");
        };
        /**
         * Words with length greater than or equal to the specified length will be replaced.
         * If the length is 0, no replacement will be performed.
         */
        Text.prototype.coverLine = function (line, length) {
            if (length < 1) {
                return line;
            }
            var odd = false;
            var replacer = function (m) {
                odd = !odd;
                return odd ? "<span class=\"cover odd\">".concat(m, "</span>")
                    : "<span class=\"cover\">".concat(m, "</span>");
            };
            return line
                .replace(RegExp("\\d*[a-zA-Z\u00E4\u00C4\u00FC\u00DC\u00F6\u00D6\u00DF\u00E9\u0153-]{".concat(length, ",}"), "g"), replacer)
                .replace(/\d+ Uhr \d+/g, replacer)
                .replace(/\d[\d\s\.,/:]*\d/g, replacer)
                .replace(/\d+/g, replacer);
        };
        Text.prototype.unescape = function (str) {
            var arrEntities = { 'lt': '<', 'gt': '>', 'nbsp': ' ', 'amp': '&', 'quot': '"' };
            return str.replace(/&(lt|gt|nbsp|amp|quot);/ig, function (_, t) { return arrEntities[t]; });
        };
        return Text;
    }());
    var Data = /** @class */ (function () {
        function Data(header, p, audio, textList) {
            this.Header = header;
            this.P = p;
            this.Audio = audio;
            this.AudioOriginalLoop = audio.loop;
            this.TextList = textList;
            this.Transcript = new Array();
            this.Note = new Array();
            for (var i = 0; i < textList.length; i++) {
                // Starting from the first one, all elements with "language" are Transcripts.
                if (textList[i].Language.length > 0) {
                    this.Transcript.push(textList[i]);
                    continue;
                }
                // If none have "language," then designate the first one as the Transcript.
                if (this.Transcript.length == 0) {
                    this.Transcript.push(textList[i]);
                    continue;
                }
                // The rest are Notes.
                this.Note = textList.slice(i);
                break;
            }
            // Set the display style of the audio element.
            this.Audio.setAttribute("controlsList", "nodownload");
            //e.playbackRate = 1;
            // Align the button and audio horizontally.
            this.Audio.style.marginRight = "1em";
            this.P.style.display = "flex";
            this.P.style.alignItems = "center";
            this.P.style.marginLeft = "2em";
            // Make the audio easier to select so that space-key can be used to play or pause.
            this.Audio.onmouseover = function (ev) {
                ev.target.focus();
            };
        }
        Data.prototype.appendButton = function (pos, button) {
            switch (pos) {
                case Position.AfterHeader:
                    button.setAttribute("class", "btn btn-link btn-lg");
                    //button.setAttribute("class", "btn btn-outline-primary btn-sm");
                    button.setAttribute("style", "margin: 0 0 0 0.5em;");
                    this.Header.insertBefore(button, null);
                    break;
                case Position.AfterAudio:
                    button.setAttribute("class", "btn btn-primary btn-lg");
                    button.setAttribute("style", "margin: 0 0.5em 0 0;");
                    this.P.insertBefore(button, null);
                    break;
            }
        };
        return Data;
    }());
    function init(print) {
        var disable = document.getElementById("not-listening");
        if (disable != null) {
            return;
        }
        var audioList = Array.from(document.getElementsByTagName("audio"));
        audioList.forEach(function (audio) {
            var p = audio.parentElement;
            // The parent element of the audio tag must be a <p> tag.
            if (!p || p.tagName != "P") {
                return;
            }
            // The element before the <p> must be an <h1>, <h2>, <h3>, etc.
            var header = p.previousElementSibling;
            if (!header || !header.tagName.match(/^H[1-9]$/)) {
                return;
            }
            // There may be multiple <pre><code></code></pre> elements following the <p>.
            var i = 1;
            var current = p;
            var textList = new Array();
            while (true) {
                var pre = current.nextElementSibling;
                if (!pre || pre.tagName.toLowerCase() != "pre") {
                    break;
                }
                var children = Array.from(pre.children);
                if (children.length != 1) {
                    return;
                }
                var code = children[0];
                if (code.tagName.toLowerCase() != "code") {
                    break;
                }
                textList.push(new Text(pre, code));
                i++;
                current = pre;
            }
            GlobalList.push(new Data(header, p, audio, textList));
        });
        if (print) {
            GlobalList.forEach(function (e) {
                // Only display the first Transcript; hide the rest.
                /* if (e.Transcript.length > 0) {
                    e.Transcript[0].coverText(0);
                    e.Transcript.slice(1).forEach(e => e.doHide());
                } */
                // Display all Transcripts.
                e.Transcript.forEach(function (t) { return t.coverText(0); });
                e.Note.forEach(function (t) { return t.doHide(); });
            });
            return;
        }
        if (GlobalList.length > 0) {
            var container = document.getElementById("top-container");
            container === null || container === void 0 ? void 0 : container.appendChild(newButton("▶ All", "AlsListening.playFrom(0, false, 1)"));
            //container?.appendChild(newButton("▶ Allx3", `AlsListening.playFrom(0, false, 3)`));
            container === null || container === void 0 ? void 0 : container.appendChild(newButton("Show/Hide Texts&Notes", "AlsListening.reverseHide(-1, true, -1, true)"));
            container === null || container === void 0 ? void 0 : container.appendChild(newButton("Cover-0", "AlsListening.coverText(-1, 0)"));
            container === null || container === void 0 ? void 0 : container.appendChild(newButton("Cover-1", "AlsListening.coverText(-1, 1)"));
            //container?.appendChild(newButton("Cover-4", `AlsListening.coverText(-1, 4)`));
        }
        GlobalList.forEach(function (e, i) {
            var _a;
            e.appendButton(Position.AfterAudio, newButton("▶▶", "AlsListening.playFrom(".concat(i, ", false, 1)")));
            //e.appendButton(Position.AfterAudio, newButton("▶▶x3", `AlsListening.playFrom(${i}, false, 3)`));
            e.appendButton(Position.AfterAudio, newButton("◀◀", "AlsListening.playFrom(".concat(i, ", true, 1)")));
            //e.appendButton(Position.AfterAudio, newButton("◀◀x3", `AlsListening.playFrom(${i}, true, 3)`));
            e.appendButton(Position.AfterAudio, newButton("Cover-0", "AlsListening.coverText(".concat(i, ", 0)")));
            //e.appendButton(Position.AfterAudio, newButton("Cover-4", `AlsListening.coverText(${i}, 4)`));
            e.Transcript.forEach(function (t, ti) { return e.appendButton(Position.AfterAudio, newButton("Text " + t.Language, "AlsListening.reverseHide(".concat(i, ", true, ").concat(ti, ", false)"))); });
            e.Note.length > 0 &&
                e.appendButton(Position.AfterAudio, newButton("Notes", "AlsListening.reverseHide(".concat(i, ", false, -1, true)")));
            doHide(-1, true, -1, true);
            (_a = e.Transcript[0]) === null || _a === void 0 ? void 0 : _a.coverText(1);
        });
    }
    AlsListening.init = init;
    function newButton(text, fn) {
        var button = document.createElement("button");
        button.setAttribute("class", "btn btn-primary btn-lg");
        button.setAttribute("style", "margin: 0 0.5em 0 0;");
        button.setAttribute("onclick", fn);
        button.innerHTML = text;
        return button;
    }
    /**
     * forward、afterward
     */
    function playFrom(index, forward, repeat) {
        repeat = Math.floor(repeat);
        var list = new Array();
        if (forward) {
            // Play backwards in reverse order.
            for (var i = 0; i <= index; i++) {
                for (var j = 1; j <= repeat; j++) {
                    list.push(GlobalList[i]);
                }
            }
        }
        else {
            // Reverse the array so that each pop returns elements in forward order.
            for (var i = GlobalList.length - 1; i >= index; i--) {
                for (var j = 1; j <= repeat; j++) {
                    list.push(GlobalList[i]);
                }
            }
        }
        var play = function (d) {
            var _a;
            (_a = d.Transcript[0]) === null || _a === void 0 ? void 0 : _a.undoHide();
            d.Audio.scrollIntoView();
            d.Audio.focus();
            d.Audio.loop = false; // Disable looping to allow to trigger the ended event.
            list.length > 0 && d.Audio.addEventListener('ended', playEndedHandler);
            d.Audio.play();
        };
        var restore = function (d) {
            var _a;
            d.Audio.removeEventListener('ended', playEndedHandler);
            (_a = d.Transcript[0]) === null || _a === void 0 ? void 0 : _a.doHide();
            d.Audio.loop = d.AudioOriginalLoop;
        };
        var d = list.pop();
        d && play(d);
        function playEndedHandler() {
            d && restore(d);
            d = list.pop();
            d && play(d);
        }
    }
    AlsListening.playFrom = playFrom;
    function doHide(index, transcript, transcript_index, note) {
        if (index >= 0) {
            if (transcript) {
                if (transcript_index >= 0) {
                    GlobalList[index].Transcript[transcript_index].doHide();
                }
                else {
                    GlobalList[index].Transcript.forEach(function (t) { return t.doHide(); });
                }
            }
            note && GlobalList[index].Note.forEach(function (t) { return t.doHide(); });
        }
        else {
            GlobalList.forEach(function (v) {
                transcript && v.Transcript.forEach(function (t) { return t.doHide(); });
                note && v.Note.forEach(function (t) { return t.doHide(); });
            });
        }
    }
    AlsListening.doHide = doHide;
    function undoHide(index, transcript, transcript_index, note) {
        if (index >= 0) {
            if (transcript) {
                if (transcript_index >= 0) {
                    GlobalList[index].Transcript[transcript_index].undoHide();
                }
                else {
                    GlobalList[index].Transcript.forEach(function (t) { return t.undoHide(); });
                }
            }
            note && GlobalList[index].Note.forEach(function (t) { return t.undoHide(); });
        }
        else {
            GlobalList.forEach(function (v) {
                transcript && v.Transcript.forEach(function (t) { return t.undoHide(); });
                note && v.Note.forEach(function (t) { return t.undoHide(); });
            });
        }
    }
    AlsListening.undoHide = undoHide;
    function reverseHide(index, transcript, transcript_index, note) {
        if (index >= 0) {
            if (transcript) {
                if (transcript_index >= 0) {
                    GlobalList[index].Transcript[transcript_index].reverseHide();
                }
                else {
                    GlobalList[index].Transcript.forEach(function (t) { return t.reverseHide(); });
                }
            }
            note && GlobalList[index].Note.forEach(function (t) { return t.reverseHide(); });
        }
        else {
            GlobalList.forEach(function (v) {
                transcript && v.Transcript.forEach(function (t) { return t.reverseHide(); });
                note && v.Note.forEach(function (t) { return t.reverseHide(); });
            });
        }
    }
    AlsListening.reverseHide = reverseHide;
    // Only the first Transcript will perform the overwrite.
    function coverText(index, length) {
        var _a;
        if (index >= 0) {
            (_a = GlobalList[index].Transcript[0]) === null || _a === void 0 ? void 0 : _a.coverText(length);
        }
        else {
            GlobalList.forEach(function (v) {
                var _a;
                (_a = v.Transcript[0]) === null || _a === void 0 ? void 0 : _a.coverText(length);
            });
        }
    }
    AlsListening.coverText = coverText;
})(AlsListening || (AlsListening = {}));
// generate js
// tsc als_listening.ts --target "es5" --lib "es2015,dom" --downlevelIteration
