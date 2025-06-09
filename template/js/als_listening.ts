// @ts-ignore
namespace AlsListening {
    let GlobalList = new Array<Data>();

    /**
     * "darkblue", "darkgreen", "darkmagenta", "darkorange", "darkred", "darkviolet"
     */
    let ColorList: string[] = ["lightcoral", "lightgreen", "lightseagreen",
        "lightpink", "goldenrod", "lightskyblue", "lightyellow",
        "cadetblue", "coral", "darkkhaki", "darkorchid", "darkgreen", "thistle"];

    enum Position {
        AfterHeader = 1,
        AfterAudio,
    };

    /**
     * <h2></h2> --Header
     * <p><audio></audio></p> --Audio
     * <pre><code></code></pre> --Text
     * <pre><code></code></pre> --NoteList
     */

    class Text {
        Pre: HTMLElement;
        Code: HTMLElement;
        Language: string; // The class of code should be like language-de, so only take "de".
        HighlightText: string; // highlighted text, used for overwriting words.

        constructor(pre: HTMLElement, code: HTMLElement) {
            this.Pre = pre;
            this.Code = code;
            let codeClass = code.className;
            if (codeClass.startsWith("language-")) {
                this.Language = codeClass.substring(9);
            } else {
                this.Language = "";
            }
            this.HighlightText = this.highlight(this.unescape(this.Code.innerHTML));
        }

        doHide(): void {
            this.Pre.style.display = "none";
        }

        undoHide(): void {
            this.Pre.style.display = "block";
        }

        reverseHide(): void {
            if (this.Pre.style.display == "none") {
                this.undoHide();
            } else {
                this.doHide();
            }
        }

        //highlight() should be called before coverText()
        highlight(text: string): string {
            let newtext = "";
            let colorMap = new Map<string, string>();
            let colorIndex = 0;
            text.split("\n").forEach((line, index, arr) => {
                if (index < arr.length - 1) {
                    line += "\n";
                }
                let name = this.parseName(line);
                if (name == "") {
                    newtext += line;
                    return
                }
                let color = colorMap.get(name) || "";
                if (color == "") {
                    color = ColorList[colorIndex];
                    colorMap.set(name, color);
                    colorIndex = (colorIndex + 1) % ColorList.length;
                }
                // highlight the names
                // replace() does only once by default, exactly what we need
                // Set to 90% size to avoid covering the underline of other text (the underline is created using a border).
                let newline = line.replace(name,
                    `<span style="font-size: 90%;background-color: ${color};">${name}</span>`);
                newtext += newline;
            })
            return newtext;
        }

        /**
         * Parse a person's name based on the following characteristics:
         * 1. The name appears at the beginning of the line;
         * 2. The name contains no more than 3 spaces;
         * 3. The name is followed by a colon (:) and a space.
         */
        parseName(line: string): string {
            //? means non-greedy (shortest) match.
            // The name may contain special French characters, which cannot be exhaustively listed.
            let mlist = line.match(/^([^:]+): /);
            // Do not process if no match is found.
            if (mlist != null) {
                let name = mlist[1];
                // Names with more than 3 spaces are not considered valid.
                let space = name.match(/ /g);
                if (space == null || space.length < 4) {
                    return name;
                }
            }
            return "";
        }

        /**
         * coverText(0) will only set the text as highlighted, without performing any replacement.
         * Words with length greater than or equal to the specified length will be replaced.
         * If the length is 0, no replacement will be performed.
         */
        coverText(length: number): void {
            if (length < 1) {
                this.Code.innerHTML = this.HighlightText;
                return;
            }
            let lineList = this.HighlightText.split("\n");
            lineList.forEach((line, i) => {
                if (line.indexOf("</span>:") >= 0) {
                    let pos = line.lastIndexOf("</span>:")
                    lineList[i] = line.substring(0, pos + "</span>: ".length)
                        + this.coverLine(line.substring(pos + "</span>: ".length), length);
                } else {
                    lineList[i] = this.coverLine(line, length);
                }
            });
            this.Code.innerHTML = lineList.join("\n");
        }

        /**
         * Words with length greater than or equal to the specified length will be replaced.
         * If the length is 0, no replacement will be performed.
         */
        coverLine(line: string, length: number): string {
            if (length < 1) {
                return line;
            }
            let odd = false;
            var replacer = function (m: string): string {
                odd = !odd;
                return odd ? `<span class="cover odd">${m}</span>`
                    : `<span class="cover">${m}</span>`;
            }
            return line
                .replace(RegExp(`\\d*[a-zA-ZäÄüÜöÖßéœ-]{${length},}`, "g"), replacer)
                .replace(/\d+ Uhr \d+/g, replacer)
                .replace(/\d[\d\s\.,/:]*\d/g, replacer)
                .replace(/\d+/g, replacer);
        }

        unescape(str: string) {
            let arrEntities = { 'lt': '<', 'gt': '>', 'nbsp': ' ', 'amp': '&', 'quot': '"' };
            return str.replace(/&(lt|gt|nbsp|amp|quot);/ig, (_, t) => { return arrEntities[t]; });
        }
    }

    class Data {
        Header: Element;
        P: HTMLElement;
        Audio: HTMLAudioElement;
        AudioOriginalLoop: boolean;
        TextList: Text[];
        Transcript: Text[];
        Note: Text[];

        constructor(header: Element, p: HTMLElement, audio: HTMLAudioElement, textList: Text[]) {
            this.Header = header;
            this.P = p;
            this.Audio = audio;
            this.AudioOriginalLoop = audio.loop;
            this.TextList = textList;
            this.Transcript = new Array<Text>();
            this.Note = new Array<Text>();

            for (let i = 0; i < textList.length; i++) {
                // Starting from the first one, all elements with "language" are Transcripts.
                if (textList[i].Language.length > 0) {
                    this.Transcript.push(textList[i]);
                    continue
                }
                // If none have "language," then designate the first one as the Transcript.
                if (this.Transcript.length == 0) {
                    this.Transcript.push(textList[i]);
                    continue
                }
                // The rest are Notes.
                this.Note = textList.slice(i);
                break
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
            this.Audio.onmouseover = (ev) => {
                (ev.target as HTMLAudioElement).focus();
            }
        }

        appendButton(pos: Position, button: HTMLButtonElement): void {
            switch (pos) {
                case Position.AfterHeader:
                    button.setAttribute("class", "btn btn-link btn-lg");
                    //button.setAttribute("class", "btn btn-outline-primary btn-sm");
                    button.setAttribute("style", "margin: 0 0 0 0.5em;");
                    this.Header.insertBefore(button, null);
                    break
                case Position.AfterAudio:
                    button.setAttribute("class", "btn btn-primary btn-lg");
                    button.setAttribute("style", "margin: 0 0.5em 0 0;");
                    this.P.insertBefore(button, null);
                    break
            }
        }
    }

    export function init(print?: boolean): void {
        let disable = document.getElementById("not-listening");
        if (disable != null) {
            return
        }
        let audioList = Array.from(document.getElementsByTagName("audio"));
        audioList.forEach((audio) => {
            let p = audio.parentElement;
            // The parent element of the audio tag must be a <p> tag.
            if (!p || p.tagName != "P") {
                return
            }

            // The element before the <p> must be an <h1>, <h2>, <h3>, etc.
            let header = p.previousElementSibling;
            if (!header || !header.tagName.match(/^H[1-9]$/)) {
                return
            }

            // There may be multiple <pre><code></code></pre> elements following the <p>.
            let i = 1;
            let current: Element = p;
            let textList = new Array<Text>();
            while (true) {
                let pre = current.nextElementSibling as HTMLElement;
                if (!pre || pre.tagName.toLowerCase() != "pre") {
                    break
                }
                let children = Array.from(pre.children);
                if (children.length != 1) {
                    return
                }
                let code = children[0] as HTMLElement;
                if (code.tagName.toLowerCase() != "code") {
                    break
                }
                textList.push(new Text(pre, code));
                i++;
                current = pre;
            }

            GlobalList.push(new Data(header, p, audio, textList));
        });

        if (print) {
            GlobalList.forEach((e) => {
                // Only display the first Transcript; hide the rest.
                /* if (e.Transcript.length > 0) {
                    e.Transcript[0].coverText(0);
                    e.Transcript.slice(1).forEach(e => e.doHide());
                } */
                // Display all Transcripts.
                e.Transcript.forEach(t => t.coverText(0));
                e.Note.forEach(t => t.doHide());
            })
            return
        }

        if (GlobalList.length > 0) {
            let container = document.getElementById("top-container");
            container?.appendChild(newButton("▶ All", `AlsListening.playFrom(0, false, 1)`));
            //container?.appendChild(newButton("▶ Allx3", `AlsListening.playFrom(0, false, 3)`));
            container?.appendChild(newButton("Show/Hide Texts&Notes", `AlsListening.reverseHide(-1, true, -1, true)`));
            container?.appendChild(newButton("Cover-0", `AlsListening.coverText(-1, 0)`));
            container?.appendChild(newButton("Cover-1", `AlsListening.coverText(-1, 1)`));
            //container?.appendChild(newButton("Cover-4", `AlsListening.coverText(-1, 4)`));
        }

        GlobalList.forEach((e, i) => {
            e.appendButton(Position.AfterAudio, newButton("▶▶", `AlsListening.playFrom(${i}, false, 1)`));
            //e.appendButton(Position.AfterAudio, newButton("▶▶x3", `AlsListening.playFrom(${i}, false, 3)`));
            e.appendButton(Position.AfterAudio, newButton("◀◀", `AlsListening.playFrom(${i}, true, 1)`));
            //e.appendButton(Position.AfterAudio, newButton("◀◀x3", `AlsListening.playFrom(${i}, true, 3)`));
            e.appendButton(Position.AfterAudio, newButton("Cover-0", `AlsListening.coverText(${i}, 0)`));
            //e.appendButton(Position.AfterAudio, newButton("Cover-4", `AlsListening.coverText(${i}, 4)`));

            e.Transcript.forEach((t, ti) => e.appendButton(Position.AfterAudio, newButton("Text " + t.Language, `AlsListening.reverseHide(${i}, true, ${ti}, false)`)));
            e.Note.length > 0 &&
                e.appendButton(Position.AfterAudio, newButton("Notes", `AlsListening.reverseHide(${i}, false, -1, true)`));
            doHide(-1, true, -1, true);

            e.Transcript[0]?.coverText(1);
        })
    }

    function newButton(text: string, fn: string): HTMLButtonElement {
        let button = document.createElement("button");
        button.setAttribute("class", "btn btn-primary btn-lg");
        button.setAttribute("style", "margin: 0 0.5em 0 0;");
        button.setAttribute("onclick", fn);
        button.innerHTML = text;
        return button;
    }

    /**
     * forward、afterward
     */
    export function playFrom(index: number, forward: boolean, repeat: number): void {
        repeat = Math.floor(repeat)

        let list = new Array<Data>();
        if (forward) {
            // Play backwards in reverse order.
            for (let i = 0; i <= index; i++) {
                for (let j = 1; j <= repeat; j++) {
                    list.push(GlobalList[i]);
                }
            }
        } else {
            // Reverse the array so that each pop returns elements in forward order.
            for (let i = GlobalList.length - 1; i >= index; i--) {
                for (let j = 1; j <= repeat; j++) {
                    list.push(GlobalList[i]);
                }
            }
        }

        var play = function (d: Data) {
            d.Transcript[0]?.undoHide();
            d.Audio.scrollIntoView();
            d.Audio.focus();
            d.Audio.loop = false; // Disable looping to allow to trigger the ended event.
            list.length > 0 && d.Audio.addEventListener('ended', playEndedHandler);
            d.Audio.play();
        }

        var restore = function (d: Data) {
            d.Audio.removeEventListener('ended', playEndedHandler);
            d.Transcript[0]?.doHide();
            d.Audio.loop = d.AudioOriginalLoop;
        }

        var d = list.pop();
        d && play(d);
        function playEndedHandler() {
            d && restore(d);
            d = list.pop();
            d && play(d);
        }
    }

    export function doHide(index: number, transcript: boolean, transcript_index: number, note: boolean): void {
        if (index >= 0) {
            if (transcript) {
                if (transcript_index >= 0) {
                    GlobalList[index].Transcript[transcript_index].doHide();
                } else {
                    GlobalList[index].Transcript.forEach(t => t.doHide());
                }
            }
            note && GlobalList[index].Note.forEach(t => t.doHide());
        } else {
            GlobalList.forEach((v) => {
                transcript && v.Transcript.forEach(t => t.doHide());
                note && v.Note.forEach(t => t.doHide());
            });
        }
    }

    export function undoHide(index: number, transcript: boolean, transcript_index: number, note: boolean): void {
        if (index >= 0) {
            if (transcript) {
                if (transcript_index >= 0) {
                    GlobalList[index].Transcript[transcript_index].undoHide();
                } else {
                    GlobalList[index].Transcript.forEach(t => t.undoHide());
                }
            }
            note && GlobalList[index].Note.forEach(t => t.undoHide());
        } else {
            GlobalList.forEach((v) => {
                transcript && v.Transcript.forEach(t => t.undoHide());
                note && v.Note.forEach(t => t.undoHide());
            });
        }
    }

    export function reverseHide(index: number, transcript: boolean, transcript_index: number, note: boolean): void {
        if (index >= 0) {
            if (transcript) {
                if (transcript_index >= 0) {
                    GlobalList[index].Transcript[transcript_index].reverseHide();
                } else {
                    GlobalList[index].Transcript.forEach(t => t.reverseHide());
                }
            }
            note && GlobalList[index].Note.forEach(t => t.reverseHide());
        } else {
            GlobalList.forEach((v) => {
                transcript && v.Transcript.forEach(t => t.reverseHide());
                note && v.Note.forEach(t => t.reverseHide());
            });
        }
    }

    // Only the first Transcript will perform the overwrite.
    export function coverText(index: number, length: number): void {
        if (index >= 0) {
            GlobalList[index].Transcript[0]?.coverText(length);
        } else {
            GlobalList.forEach((v) => {
                v.Transcript[0]?.coverText(length);
            });
        }
    }
}

// generate js
// tsc als_listening.ts --target "es5" --lib "es2015,dom" --downlevelIteration