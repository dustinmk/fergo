import chai, {expect} from "chai";
import jsdom from "mocha-jsdom";
import {v, mount, redraw, redrawSync, selectRedraw, ComponentAttributes} from "src/index";
import chaiDOM from "chai-dom";
import {mountAndMatch, redrawAndMatch, getRootElement} from "./test_common";

chai.use(chaiDOM);
selectRedraw(redrawSync);

describe("Core", () => {
    jsdom({url: "http://localhost"});

    it("Creates and updates p elem", () => {
        let text = "text 1";
        const root = v(() => v("p", text));
        mountAndMatch(root, "p", ["text 1"]);
        text = "text 2";
        redrawAndMatch(root, "p", ["text 2"])
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
    
        mountAndMatch(root, "p", [
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
        redrawAndMatch(root, "p", [
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

        mountAndMatch(root, "p", ["text 1", "text 2"]);
        toggle = false;
        redrawAndMatch(root, "p", ["text 2"]);
    })

    it("Clears children", () => {
        let toggle = true;
        const root = v(() => v("div", [
            toggle && v("p", "text 1"),
            toggle && v("p", "text 2"),
            toggle && v("p", "text 3"),
        ]));

        mountAndMatch(root, "p", ["text 1", "text 2", "text 3"]);
        toggle = false;
        redrawAndMatch(root, "p", []);
    });

    it("Adds to an empty div", () => {
        let toggle = false;
        const root = v(() => v("div", [
            toggle && v("p", "text 1"),
            toggle && v("p", "text 2"),
            toggle && v("p", "text 3"),
        ]));

        mountAndMatch(root, "p", [])
        toggle = true;
        redrawAndMatch(root, "p", ["text 1", "text 2", "text 3"]);
    })

    it("Handles mixed toggles", () => {
        let toggle = true;
        const root = v(() => v("div", [
            !toggle && v("p", "second 1"),
            v("p", "1"),
            toggle && v("p", "first 1"),
            v("p", "2")
        ]));

        mountAndMatch(root, "p", ["1", "first 1", "2"]);
        toggle = false;
        redrawAndMatch(root, "p", ["second 1", "1", "2"]);
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

        mountAndMatch(root, "p", ["text 1", "text 3"]);
        toggle = true;
        redrawAndMatch(root, "p", ["text -1", "text 0", "text 1", "text 2", "text 2a", "text 3", "text 4", "text 5"]);
    })

    it("Handles variable child lists", () => {

        const c1 = v("li", "1");
        const c2 = v("li", "2");
        const c3 = v("li", "3");

        let children = [c1, c2];
        const root = v(() => v("ul", children));
        mountAndMatch(root, "li", ["1", "2"]);

        children = [c1, c3, c2];
        redrawAndMatch(root, "li", ["1", "3", "2"]);

        children = [c2, c1, c3]
        redrawAndMatch(root, "li", ["2", "1", "3"]);

        children = [c2];
        redrawAndMatch(root, "li", ["2"]);

        children = [];
        redrawAndMatch(root, "li", []);
    })

    it("Reorders reused vdoms", () => {

        const c1 = v("li", "1");
        const c2 = v("li", "2");
        const c3 = v("li", "3");

        let children = [c1, c3, c2];
        const root = v(() => v("ul", children));
        mountAndMatch(root, "li", ["1", "3", "2"]);

        children = [c2, c1, c3]
        redrawAndMatch(root, "li", ["2", "1", "3"]);
    })

    it("Clears a variable list", () => {
        const children = [
            v("li", "1"),
            v("li", "2")
        ];

        const root = v(() => v("ul", children));
        mountAndMatch(root, "li", ["1", "2"]);

        children.splice(0, 2);
        redrawAndMatch(root, "li", []);
    })

    it("Redraws multiple times", () => {
        let t = "spllen";

        const root = v(() =>
            v("div#top", [
                v("h1", "header"),
                v("p", t),
                v("p", "more text")
            ]));
        
        mountAndMatch(root, "div#top>*", ["header", "spllen", "more text"]);

        t = "text";
        redrawAndMatch(root, "div#top>*", ["header", "text", "more text"]);

        t = "arbugle";
        redrawAndMatch(root, "div#top>*", ["header", "arbugle", "more text"]);
    });

    it("Redraws from passed in vdom", () => {
        let text = "first";
        let root: ComponentAttributes | null = null;

        mountAndMatch((vdom) => {
            root = vdom;
            return v("div", [
                v("p", "root"),
                v("p", text)
            ])
        }, "p", ["root", "first"]);

        expect(root).to.not.be.null;
        if (root === null) { throw new Error("Thisi s just to make Typescript happy"); }

        text = "second";
        redrawAndMatch(root, "p", ["root", "second"]);
    })

    it("Rearranges keyed elements", () => {
        const [c1, c2, c3, c4, c5, c6] = [1, 2, 3, 4, 5, 6].map(n => v("li", {key: n.toString()}, n.toString()));
        let children = [c1, c2, c3, c4, c5, c6];
        const root = v(() => v("ul", children));

        mountAndMatch(root, "li", ["1", "2", "3", "4", "5", "6"])

        children = [c2, c4, c1, c5, c3, c6];
        redrawAndMatch(root, "li", ["2", "4", "1", "5", "3", "6"])
    })

    it("Mixes keyed elements with non-keyed", () => {
        const [k1, k2, k3, k4, k5, k6] = [1, 2, 3, 4, 5, 6].map(n => v("li", {key: n}, `k${n}`));
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

    it("Redraws a set of unchanging elements", () => {
        const root = v(() => v("ul", [
            v("p", "1"),
            v("p", "2"),
            v("p", "3")
        ]));

        mountAndMatch(root, "p", ["1", "2", "3"])
        redrawAndMatch(root, "p", ["1", "2", "3"])
    })

    
});

