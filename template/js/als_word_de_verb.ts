// @ts-ignore
namespace AlsWordDEVerb {
    let GlobalList = new Array<Data>();
    let GlobalTestMap = new Map<string, Test>();

    class Data {
        /**
         * W1: Infinitiv
         * W2: dritte Person Singular
         * W3: Präteritum
         * W4: Perfekt
         */
        WList: string[] = new Array<string>();
        Notiz: string = "";

        constructor(e: Element) {
            let m = new Map<string, string>();
            Array.from(e.children).forEach((c) => {
                switch (c.tagName) {
                    case "Notiz".toUpperCase():
                        this.Notiz += c.innerHTML.trim();
                        break;
                    default:
                        m.set(c.tagName, c.innerHTML.trim());
                        break;
                }
            })
            this.initWList(m);
        }

        initWList(m: Map<string, string>): void {
            // Search in order for W1, W2, W3, W4... If there is a break, stop and ignore the rest.
            for (let i = 1; ; i++) {
                if (m.has(`W${i}`)) {
                    this.WList.push(m.get(`W${i}`) || "");
                } else {
                    break
                }
            }
            // Remove empty values from the end going backwards.
            while (true) {
                if (this.WList[this.WList.length - 1] == "") {
                    this.WList.pop();
                } else {
                    break
                }
            }
        }

        html(): string {
            let innerHTML = `<div class="wort">`;
            innerHTML += `<div style="display: flex;">`;
            innerHTML += `<div class="wort-col1">${this.WList.join(", ")}</div>`;
            innerHTML += `</div>`;
            if (this.Notiz != "") {
                innerHTML += `<div class="pre">${this.Notiz}</div>`;
            }
            innerHTML += `</div>`;
            return innerHTML;
        }

        getQuestion(): string {
            let qList = new Array<string>();
            this.WList.forEach((v) => {
                if (v.length > 0) qList.push(v);
            })
            return qList[Math.floor((Math.random() * qList.length))];
        }

        getAnswer(): string {
            return `<table>` +
                `<tr><td>Infinitiv</td><td>${this.WList[0]}</td></tr>` +
                `<tr><td>dritte Person Singular</td><td>${this.WList[1]}</td></tr>` +
                `<tr><td>Präteritum</td><td>${this.WList[2]}</td></tr>` +
                `<tr><td>Perfekt</td><td>${this.WList[3]}</td></tr>` +
                `</table>` +
                `${this.Notiz}`;
        }
    }

    // The goal is to complete one round of testing before starting the next, 
    // in order to prevent randomness from being uneven and causing some items to rarely be tested.
    class Test {
        list: Data[] = [];

        constructor(Kapitel: string) {
            this.list = Array.from(GlobalList);
        }

        // Math.random() can be frustrating sometimes because it doesn't always feel truly random,
        // so add some complexity to improve randomness.
        // Math.random() provides precision up to 14 decimal places.
        random(): Data {
            let index = Math.floor(Math.random() * 123456789) % this.list.length;
            let d = this.list[index];
            this.list.splice(index, 1);
            console.log("left in this round", this.list.length);
            return d;
        }

        empty(): boolean {
            return this.list.length == 0;
        }

        left(): number {
            return this.list.length;
        }
    }

    export function init(showButton: boolean): void {
        let elementList = Array.from(document.getElementsByClassName("Verb"));
        elementList.forEach((e) => {
            let w = new Data(e);
            e.innerHTML = w.html();
            GlobalList.push(w);
        })
        if (GlobalList.length > 0 && showButton) {
            let container = document.getElementById("top-container");
            container?.appendChild(newButton("Verb Test", ""));
        }
    }

    function newButton(text: string, Kapitel: string): Element {
        let button = document.createElement("button");
        button.setAttribute("class", "btn btn-primary btn-lg");
        button.setAttribute("style", "margin: 0 0.5em 0 0;");
        button.setAttribute("onclick", `AlsWordDEVerb.nextTest("${Kapitel}")`);
        button.innerHTML = text;
        return button;
    }

    export function hiddenAnswer() {
        // @ts-ignore
        $("#modal1-answer").css("visibility", "hidden");
    }

    export function showAnswer() {
        // @ts-ignore
        $("#modal1-answer").css("visibility", "visible");
    }

    export function nextTest(Kapitel: string) {
        hiddenAnswer();
        // @ts-ignore
        $("#modal1-show").attr("onclick", "AlsWordDEVerb.showAnswer()");
        // @ts-ignore
        $("#modal1-next").attr("onclick", `AlsWordDEVerb.nextTest("${Kapitel}")`);

        if (!GlobalTestMap.has(Kapitel) || GlobalTestMap.get(Kapitel)?.empty()) {
            console.log("new round started");
            GlobalTestMap.set(Kapitel, new Test(Kapitel));
        }
        let d = GlobalTestMap.get(Kapitel)?.random();
        if (d) {
            // @ts-ignore
            $("#modal1-question").html(d.getQuestion());
            // @ts-ignore
            $("#modal1-answer").html(d.getAnswer());
            // @ts-ignore
            $("#modal1-num").html("left: " + GlobalTestMap.get(Kapitel)?.left());
        }

        // @ts-ignore
        $("#modal1").modal('show');
    }
}

// generate js
// tsc als_word_de_verb.ts --target "es5" --lib "es2015,dom" --downlevelIteration