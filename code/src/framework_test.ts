import chai, {expect} from "chai";
import * as sinon from "sinon";
import jsdom from "mocha-jsdom";
import {v, mount, redraw, Vdom} from "src/index";
import chaiDOM from "chai-dom";
import beautify from "js-beautify";

chai.use(chaiDOM);

describe("test test", () => {
    jsdom({url: "http://localhost"});

    it("Creates and updates p elem", () => {
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

    it("Removes an element", () => {
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

    it("Clears children", () => {
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

    it("Adds to an empty div", () => {
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

    it("Adds in the correct order", () => {
        let toggle = false;
        const root = v(() => v("div", [
            toggle && v("p", "text -1"),
            toggle && v("p", "text 0"),
            v("p", "text 1"),
            toggle && v("p", "text 2"),
            toggle && v("p", "text 2a"),
            v("p", "text 3"),
            toggle && v("p", "text 4"),
            toggle && v("p", "text 5")
        ]));

        mount(getRootElement(), root);
        printDocument();
        expect(document.querySelectorAll("p"))
            .to.have.text(["text 1", "text 3"]);

        toggle = true;
        redraw(root);
        printDocument();
        expect(document.querySelectorAll("p"))
            .to.have.text(["text -1", "text 0", "text 1", "text 2", "text 2a", "text 3", "text 4", "text 5"]);
    })

    it("Handles variable child lists", () => {

        const children = [
            v("li", "1"),
            v("li", "2")
        ];

        const root = v(() => v("ul", children));
        mount(getRootElement(), root);
        printDocument();
        expect(document.querySelectorAll("li")).to.have.text(["1", "2"]);

        // children.push(v("li", "2"));
        // redraw(root);
        // //mount(getRootElement(), root);
        // printDocument();
        // expect(document.querySelectorAll("li")).to.have.text(["1", "2"]);

        children.splice(0, 1);
        redraw(root);
        printDocument();
        expect(document.querySelectorAll("li")).to.have.text(["2"]);

        children.splice(0, 1);
        redraw(root);
        printDocument();
        expect(document.querySelectorAll("li")).to.have.text([]);
    })

    it("Clears a variable list", () => {
        const children = [
            v("li", "1"),
            v("li", "2")
        ];

        const root = v(() => v("ul", children));
        mount(getRootElement(), root);
        printDocument();
        expect(document.querySelectorAll("li")).to.have.text(["1", "2"]);

        children.splice(0, 2);
        redraw(root);
        printDocument();
        expect(document.querySelectorAll("li")).to.have.text([]);
    })

    it("redraws multiple times", () => {
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

    it("Redraws a child component", () => {
        let text = "first";

        const child = v(() =>
            v("div", [
                v("p", "child"),
                v("p", text)
            ])
        );

        const parent = v(() => v("div", [
            v("p", "parent"),
            v("p", text),       // Should not redraw
            child
        ]));

        mount(getRootElement(), parent);
        printDocument();
        expect(document.querySelectorAll("p")).to.have.text(["parent", "first", "child", "first"]);

        text = "second";
        redraw(child);
        printDocument();
        expect(document.querySelectorAll("p")).to.have.text(["parent", "first", "child", "second"]);
    });

    it("Redraws a parent component", () => {
        let text = "first";

        const child_component = v("div", [
            v("p", "child"),
            v("p", text)        // Should not redraw
        ]);

        const generator = () => child_component;

        const generator_spy = sinon.spy(generator);

        const child = v(generator_spy);

        const parent = v(() => v("div", [
            v("p", "parent"),
            v("p", text),
            child
        ]));

        mount(getRootElement(), parent);
        printDocument();
        expect(document.querySelectorAll("p")).to.have.text(["parent", "first", "child", "first"]);

        text = "second";
        redraw(parent);
        printDocument();
        expect(document.querySelectorAll("p")).to.have.text(["parent", "second", "child", "first"]);
        expect(generator_spy.called).to.be.true;
    })

    it("Rebuilds a child component", () => {
        let text = "first";

        const child = () => v(() =>
            v("div", [
                v("p", "child"),
                v("p", text)
            ])
        );

        const parent = v(() => v("div", [
            v("p", "parent"),
            v("p", text),       // Should not redraw
            child()
        ]));

        mount(getRootElement(), parent);
        printDocument();
        expect(document.querySelectorAll("p")).to.have.text(["parent", "first", "child", "first"]);

        text = "second";
        redraw(parent);
        printDocument();
        expect(document.querySelectorAll("p")).to.have.text(["parent", "second", "child", "second"]);
    })

    it("Redraws a middle component twice", () => {
        let text = "first";

        const child_contents = v("div", [
            v("p", "child"),
            v("p", text)
        ]);

        const child = v(() => child_contents);

        const middle = v(() =>
            v("div", [
                v("p", "middle"),
                v("p", text),
                child
            ]));

        const parent = v(() =>
        v("div", [
            v("p", "parent"),
            v("p", text),
            middle
        ]));

        mount(getRootElement(), parent);
        printDocument();
        expect(document.querySelectorAll("p")).to.have.text(["parent", "first", "middle", "first", "child", "first"]);

        text = "second";
        redraw(middle);
        printDocument();
        expect(document.querySelectorAll("p")).to.have.text(["parent", "first", "middle", "second", "child", "first"]);

        text = "third";
        redraw(middle);
        printDocument();
        expect(document.querySelectorAll("p")).to.have.text(["parent", "first", "middle", "third", "child", "first"]);
    })

    it("Redraws from a non-functional component after a redraw", () => {
        let text = "first";
        const redraw_component = v("p", "start here");

        mount(getRootElement(), () => v("div", [
            v("p", "parent"),
            v("p", text),
            v("div", [
                redraw_component
            ])
        ]))

        printDocument();
        expect(document.querySelectorAll("p")).to.have.text(["parent", "first", "start here"]);

        text = "second";
        redraw(redraw_component);
        printDocument();
        expect(document.querySelectorAll("p")).to.have.text(["parent", "second", "start here"]);
    })

    it("Redraws from passed in vdom", () => {
        let text = "first";
        let root: Vdom | null = null;

        mount(getRootElement(), (vdom) => {
            root = vdom;
            return v("div", [
                v("p", "root"),
                v("p", text)
            ])
        });

        expect(document.querySelectorAll("p")).to.have.text(["root", "first"]);
        printDocument();

        expect(root).to.not.be.null;

        if (root === null) { throw new Error("vdom is null"); }

        text = "second";
        redraw(root);
        printDocument();
        expect(document.querySelectorAll("p")).to.have.text(["root", "second"]);
    })
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