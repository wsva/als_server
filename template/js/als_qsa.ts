/**
 * QSA: Question-Suggestion-Answer
 */

// @ts-ignore
namespace AlsQSA {
    let GlobalList = new Array<Data>();
    let GlobalTest: Test;

    class Data {
        Q: string = "";
        S: string = "";
        A: string = "";
        NeedSwap: boolean = false;

        constructor(e: Element) {
            if (e.hasAttribute("swap")) this.NeedSwap = true;

            Array.from(e.children).forEach((c) => {
                switch (c.tagName) {
                    case "Q":
                        this.Q = c.innerHTML.trim();
                        break;
                    case "S":
                        this.S = c.innerHTML.trim();
                        break;
                    case "A":
                        this.A = c.innerHTML.trim();
                        break;
                }
            })
        }

        validate(): boolean {
            return this.Q.length > 0 && this.A.length > 0;
        }

        swap(): Data {
            let qsa = new Data(document.createElement("div"));
            qsa.Q = this.A;
            qsa.S = this.S;
            qsa.A = this.Q;
            return qsa;
        }

        html(): string {
            let innerHTML = `<div class="qsa">`;
            if (this.Q != "") {
                innerHTML += `<div class="qsa-q">${this.Q}</div>`;
            }
            if (this.S != "") {
                innerHTML += `<div class="qsa-s">${this.S}</div>`;
            }
            if (this.A != "") {
                innerHTML += `<div class="qsa-a">${this.A}</div>`;
            }
            innerHTML += `</div>`;
            return innerHTML;
        }

        getQuestion(): string {
            let innerHTML = `<div style="display: flex; flex-direction: column;">`;
            innerHTML += `<div>${this.Q}</div>`;
            innerHTML += `<div><font color=#A52A2A >${this.S}</font></div>`;
            innerHTML += `</div>`;
            return innerHTML;
        }

        getAnswer(): string {
            let innerHTML = `${this.A}`;
            return innerHTML;
        }
    }

    // The goal is to complete one round of testing before starting the next, 
    // in order to prevent randomness from being uneven and causing some items to rarely be tested.
    class Test {
        list: Data[] = [];

        constructor() {
            this.list = Array.from(GlobalList);
        }

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
        let elementList = Array.from(document.getElementsByClassName("QSA"));
        elementList.forEach((e) => {
            let w = new Data(e);
            if (w.validate()) {
                e.innerHTML = w.html();
                GlobalList.push(w);
                if (w.NeedSwap) GlobalList.push(w.swap());
                //隐藏
                //e.setAttribute("style", "display: none;");
            } else {
                e.innerHTML += `<span style="background-color: red;">validate error<span >`;
            }
        })
        if (GlobalList.length > 0 && showButton) {
            let container = document.getElementById("top-container");
            container?.appendChild(newButton("QSA Test"));
        }
    }

    function newButton(text: string): Element {
        let button = document.createElement("button");
        button.setAttribute("class", "btn btn-primary btn-lg");
        button.setAttribute("style", "margin: 0 0.5em 0 0;");
        button.setAttribute("onclick", `AlsQSA.nextTest()`);
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

    export function nextTest() {
        hiddenAnswer();
        // @ts-ignore
        $("#modal1-show").attr("onclick", "AlsQSA.showAnswer()");
        // @ts-ignore
        $("#modal1-next").attr("onclick", `AlsQSA.nextTest()`);

        if (!GlobalTest || GlobalTest.empty()) {
            console.log("new round started");
            GlobalTest = new Test();
        }
        let d = GlobalTest.random();
        if (d) {
            // @ts-ignore
            $("#modal1-question").html(d.getQuestion());
            // @ts-ignore
            $("#modal1-answer").html(d.getAnswer());
            // @ts-ignore
            $("#modal1-num").html("left: " + GlobalTest.left());
        }

        // @ts-ignore
        $("#modal1").modal('show');
    }
}

// generate js
// tsc als_qsa.ts --target "es5" --lib "es2015,dom" --downlevelIteration