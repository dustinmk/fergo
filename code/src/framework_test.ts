import chai, {expect} from "chai";
import jsdom from "mocha-jsdom";
import {v, mount, redraw} from "src/index";
import chaiDOM from "chai-dom";
import beautify from "js-beautify";

chai.use(chaiDOM);

describe("test test", () => {
    jsdom({url: "http://localhost"});

    xit("tests", () => {
        document.body.innerHTML = `<h1>This is text</h1>`;
        expect((<Element>document.body.children.item(0)).innerHTML).to.equal("This is text");
    });

    xit("Creates and updates p elem", () => {
        let text = "text 1";
        const root = v(() => v("p", text));
        mount(getRootElement(), root);
        printDocument();
        expect(document.querySelector("p"))
            .to.have.text("text 1");

        text = "text 2";
        redraw(root);
        printDocument();
        expect(document.querySelector("p"))
            .to.have.text("text 2");
    });

    it("Creates and updates nested elems", () => {
        let start = 0;
        let toggle = true;
        const root = v(() => v("div", [
            v("div", [
                !toggle && v("p", "second 1"),
                v("p", `text ${++start}`),
                v("p", `text ${++start}`),
                v("p", `text ${++start}`),
                toggle && v("p", "first 1"),
                v("div", [
                    v("p", `text ${++start}`),
                    v("p", `text ${++start}`),
                    v("p", `text ${++start}`),
                ])
            ]),
            v("div", [
                v("p", `text ${++start}`),
                toggle && v("p", "first 2"),
            ]),
            v("div", [
                !toggle && v("p", "second 2"),
            ])
        ]));
    
        mount(getRootElement(), root);
        printDocument();
        expect(document.querySelectorAll("p"))
            .to.have.text([
                "text 1",
                "text 2",
                "text 3",
                "first 1",
                "text 4",
                "text 5",
                "text 6",
                "text 7",
                "first 2"
            ]);

        start = 10;
        toggle = false;
        redraw(root);
        printDocument();
        expect(document.querySelectorAll("p"))
            .to.have.text([
                "second 1",
                "text 11",
                "text 12",
                "text 13",
                "text 14",
                "text 15",
                "text 16",
                "text 17",
                "second 2"
            ]);
    });

    xit("Removes an element", () => {
        let toggle = true;
        const root = v(() => v("div", [
            toggle && v("p", "text 1"),
            v("p", "text 2")
        ]));

        mount(getRootElement(), root);
        printDocument();
        expect(document.querySelectorAll("p"))
            .to.have.text(["text 1", "text 2"]);

        toggle = false;
        redraw(root);
        printDocument();
        expect(document.querySelectorAll("p"))
            .to.have.text(["text 2"]);
    })

    xit("Clears children", () => {
        let toggle = true;
        const root = v(() => v("div", [
            toggle && v("p", "text 1"),
            toggle && v("p", "text 2"),
            toggle && v("p", "text 3"),
        ]));

        mount(getRootElement(), root);
        printDocument();
        expect(document.querySelectorAll("p"))
            .to.have.text(["text 1", "text 2", "text 3"]);

        toggle = false;
        redraw(root);
        printDocument();
        expect(document.querySelectorAll("p"))
            .to.have.text([]);
    });

    xit("Adds to an empty div", () => {
        let toggle = false;
        const root = v(() => v("div", [
            toggle && v("p", "text 1"),
            toggle && v("p", "text 2"),
            toggle && v("p", "text 3"),
        ]));

        mount(getRootElement(), root);
        printDocument();
        expect(document.querySelectorAll("p"))
            .to.have.text([]);

        toggle = true;
        redraw(root);
        printDocument();
        expect(document.querySelectorAll("p"))
            .to.have.text(["text 1", "text 2", "text 3"]);
    })

    it("mounts and redraws a vdom", () => {
        let t = "spllen";

        const root = v(() =>
            v("div#root", [
                v("h1", "header"),
                v("p", t),
                v("p", "more text")
            ]));
        
        mount(getRootElement(), root);
        printDocument();

        expect(document.querySelector("div#root"))
            .to.have.length(1);
        expect(document.querySelector("div#root>div"))
            .to.have.length(3);
        expect(document.querySelectorAll("div#root>div>*"))
            .to.have.text(["header", "spllen", "more text"]);

        t = "text";
        redraw(root);
        printDocument();

        expect(document.querySelectorAll("div#root>div>*"))
            .to.have.text(["header", "text", "more text"]);

        t = "arbugle";
        redraw(root);
        printDocument();

        expect(document.querySelectorAll("div#root>div>*"))
            .to.have.text(["header", "arbugle", "more text"]);
    });
});

function getRootElement() {
    document.body.innerHTML = `<div id="root"></div>`;
    let root = document.getElementById("root");
    if (root === null) {
        throw new Error("Root element not found.");
    }
    return root;
}

function printDocument() {
    const body = document.querySelector("body");
    if(body !== null) {
        const html = body.outerHTML;
        console.log(beautify.html(html));
    }
}