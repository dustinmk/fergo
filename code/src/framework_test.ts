import chai, {expect} from "chai";
import * as sinon from "sinon";
import jsdom from "mocha-jsdom";
import {v, mount, redraw, Vdom} from "src/index";
import chaiDOM from "chai-dom";
import beautify from "js-beautify";
import { Props, VdomGenerator } from "./vdom";

chai.use(chaiDOM);

describe("Framework Test", () => {
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

    it("Handles mixed toggles", () => {
        let toggle = true;
        const root = v(() => v("div", [
            !toggle && v("p", "second 1"),
            v("p", "1"),
            toggle && v("p", "first 1"),
            v("p", "2")
        ]));

        mount(getRootElement(), root);
        printDocument();
        expect(document.querySelectorAll("p"))
            .to.have.text(["1", "first 1", "2"]);

        toggle = false;
        redraw(root);
        printDocument();
        expect(document.querySelectorAll("p"))
            .to.have.text(["second 1", "1", "2"]);
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

        const c1 = v("li", "1");
        const c2 = v("li", "2");
        const c3 = v("li", "3");

        let children = [c1, c2];
        const root = v(() => v("ul", children));
        mount(getRootElement(), root);
        printDocument();
        expect(document.querySelectorAll("li")).to.have.text(["1", "2"]);

        children = [c1, c3, c2];
        redraw(root);
        printDocument();
        expect(document.querySelectorAll("li")).to.have.text(["1", "3", "2"]);

        children = [c2, c1, c3];
        redraw(root);
        printDocument();
        expect(document.querySelectorAll("li")).to.have.text(["2", "1", "3"]);

        children = [c2];
        redraw(root);
        printDocument();
        expect(document.querySelectorAll("li")).to.have.text(["2"]);

        children = [];
        redraw(root);
        printDocument();
        expect(document.querySelectorAll("li")).to.have.text([]);
    })

    it("Reorders reused vdoms", () => {

        const c1 = v("li", "1");
        const c2 = v("li", "2");
        const c3 = v("li", "3");

        let children = [c1, c3, c2];
        const root = v(() => v("ul", children));
        mount(getRootElement(), root);
        printDocument();
        expect(document.querySelectorAll("li")).to.have.text(["1", "3", "2"]);

        //children = [c2, c1, c3];
        children = [{...c2}, {...c1}, {...c3}]
        redraw(root);
        printDocument();
        expect(document.querySelectorAll("li")).to.have.text(["2", "1", "3"]);
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

    it("Rearranges keyed elements", () => {
        const [c1, c2, c3, c4, c5, c6] = [1, 2, 3, 4, 5, 6].map(n => v("li", {key: n.toString()}, n.toString()));
        let children = [c1, c2, c3, c4, c5, c6];
        const root = v(() => v("ul", children));

        mount(getRootElement(), root);
        expect(document.querySelectorAll("li")).to.have.text(["1", "2", "3", "4", "5", "6"])

        children = [c2, c4, c1, c5, c3, c6];
        redraw(root);
        expect(document.querySelectorAll("li")).to.have.text(["2", "4", "1", "5", "3", "6"])
    })

    it("Mixes keyed elements with non-keyed", () => {
        const [k1, k2, k3, k4, k5, k6] = [1, 2, 3, 4, 5, 6].map(n => v("li", {key: n.toString()}, `k${n}`));
        const [u1, u2, u3, u4, u5, u6] = [1, 2, 3, 4, 5, 6].map(n => v("li", `u${n}`));
        let children = [k1, k2, u1, k3, u2, u3];
        const root = v(() => v("ul", children));

        mount(getRootElement(), root);
        expect(document.querySelectorAll("li")).to.have.text(["k1", "k2", "u1", "k3", "u2", "u3"])

        children = [k4, u3, k2, u1, u4, k5, u5, u6, k6];
        redraw(root);
        expect(document.querySelectorAll("li")).to.have.text(["k4", "u3", "k2", "u1", "u4", "k5", "u5", "u6", "k6"])
    })

    it("Removes keyed elements", () => {
        const [k1, k2, k3] = [1, 2, 3].map(n => v("li", {key: `${n}`}, `${n}`))
        let children = [k1, k2];
        const root = v(() => v("ul", children));

        mount(getRootElement(), root);
        expect(document.querySelectorAll("li")).to.have.text(["1", "2"]);

        children = [k3, k2];
        redraw(root);
        expect(document.querySelectorAll("li")).to.have.text(["3", "2"]);
    })

    it("Throws when keys not unique", () => {
        expect(mount(getRootElement(), () => v("ul", [
            v("li", {key: "1"}),
            v("li", {key: "1"})
        ]))).to.throw;
    })

    it("Prevents redraw when props are not changed", () => {
        interface PropType extends Props {
            text: string;
        }

        let change_child = "change inner first";
        let change_outer = "change outer first";

        const child: VdomGenerator<PropType> = (_: Vdom, props: PropType) => v("div", [
            v("p", props.text),
            v("p", change_child)
        ]);

        const root = v(() => v("div", [
            v(child, {text: "text"}),
            v("p", change_outer)
        ]))

        mount(getRootElement(), root);
        expect(document.querySelectorAll("p")).to.have.text(["text", "change inner first", "change outer first"])

        change_child = "change inner second";
        change_outer = "change outer second";
        redraw(root);
        expect(document.querySelectorAll("p")).to.have.text(["text", "change inner first", "change outer second"]) 
    })

    it("Redraws child when props change", () => {
        interface PropType extends Props {
            text: string;
        }

        let props = {text: "first"};

        const child = (props: PropType) => v((_: Vdom, props: PropType) => v("div", [
            v("p", props.text),
        ]), {...props, shouldUpdate});

        const shouldUpdate = (o: PropType, n: PropType) => o.text !== n.text;

        const root = v(() => v("div", [
            child(props),
            v("p", "root")
        ]))

        mount(getRootElement(), root);
        expect(document.querySelectorAll("p")).to.have.text(["first", "root"])

        props = {text: "second"};
        redraw(root);
        expect(document.querySelectorAll("p")).to.have.text(["second", "root"]) 
    })

    it("Redraws child when generator changes", () => {
        interface PropType extends Props {
            text: string;
        }

        let props = {text: "text"};
        let toggle = false;
        const child1 = (_: Vdom, props: PropType) => v("div", [
            v("p", "child1"),
            v("p", props.text),
        ]);

        const child2 = (_: Vdom, props: PropType) => v("div", [
            v("p", "child2"),
            v("p", props.text),
        ]);

        const root = v(() => v("div", [
            v(toggle ? child2 : child1, props),
            v("p", "root")
        ]))

        mount(getRootElement(), root);
        expect(document.querySelectorAll("p")).to.have.text(["child1", "text", "root"])

        toggle = true;
        redraw(root);
        expect(document.querySelectorAll("p")).to.have.text(["child2", "text", "root"]) 
    })

    it.only("Uses state", () => {
        interface PropType extends Props {
            state: {count: number}
        }

        const generator = (_: Vdom, props: PropType) => {
            props.state.count += 1;
            return v("p", `${props.state.count}`)
        }

        const child = v(generator, {state: {count: 0}});

        mount(getRootElement(), () => v("div", [
            v("h1", "root"),
            child
        ]))
        printDocument()
        redraw(child)
        printDocument()
        redraw(child)
        printDocument()
        redraw(child)
        printDocument()
        expect(document.querySelectorAll("p")).to.have.text(["4"])
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