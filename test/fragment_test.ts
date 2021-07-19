import chai, {expect} from "chai";
import jsdom from "mocha-jsdom";
import {v, mount, redraw, redrawSync, selectRedraw} from "src/index";
import chaiDOM from "chai-dom";
import {getRootElement, printDocument} from "./test_common";

chai.use(chaiDOM);
selectRedraw(redrawSync);

describe("Fragments", () => {
    jsdom({url: "http://localhost"});

    it("redraws mixed fragment", () => {
        let toggle = true;
        const root = v(() => v("div", toggle
            ? [
                v("p", "1"),
                [
                    v("p", "2"),
                    [
                        v("p", "3"),
                        v("p", "4"),
                        v("p", "5")
                    ],
                    v("p", "6")
                ],
                v("p", "7")
            ]
            : [
                [
                    v("p", "7"),
                    v("p", "6"),
                    v("p", "5")
                ],
                [
                    v("p", "4"),
                    v("p", "3"),
                    v("p", "2")
                ],
                [
                    v("p", "1"),
                    v("p", "8"),
                    v("p", "9")
                ],
            ]));
        mount(getRootElement(), root);
        expect(document.querySelectorAll("p")).to.have.text(["1", "2", "3", "4", "5", "6", "7"])
        toggle = false;
        redraw(root)
        expect(document.querySelectorAll("p")).to.have.text(["7", "6", "5", "4", "3", "2", "1", "8", "9"])
    })

    it("replaces element with fragment and nested fragment with fragment", () => {
        let toggle = true;
        const root = v(() => v("div", toggle
            ? [
                v("p", "1"),
                [
                    v("p", "2"),
                    [
                        v("p", "3"),
                        v("p", "4")
                    ],
                    v("p", "6")
                ],
            ]
            : [
                [
                    v("p", "7"),
                    v("p", "6")
                ],
                [
                    v("p", "4"),
                    v("p", "3")
                ],
            ]));
        mount(getRootElement(), root);
        expect(document.querySelectorAll("p")).to.have.text(["1", "2", "3", "4", "6"])
        toggle = false;
        redraw(root)
        expect(document.querySelectorAll("p")).to.have.text(["7", "6", "4", "3"])
    })

    it("replaces second element with fragment", () => {
        let toggle = true;
        const root = v(() => v("div", toggle
            ? [
                v("p", "1"),
                v("p", "2")
            ]
            : [
                v("p", "1"),
                [
                    v("p", "3"),
                    v("p", "4"),
                ],
            ]));
        mount(getRootElement(), root);
        printDocument()
        expect(document.querySelectorAll("p")).to.have.text(["1", "2"])
        toggle = false;
        redraw(root)
        printDocument()
        expect(document.querySelectorAll("p")).to.have.text(["1", "3", "4"])
    })

    it("replaces first element with fragment", () => {
        let toggle = true;
        const root = v(() => v("div", toggle
            ? [
                v("p", "1"),
                v("p", "2")
            ]
            : [ 
                [
                    v("p", "3"),
                    v("p", "4"),
                ],
                v("p", "1"),
            ]));
        mount(getRootElement(), root);
        expect(document.querySelectorAll("p")).to.have.text(["1", "2"])
        toggle = false;
        redraw(root)
        expect(document.querySelectorAll("p")).to.have.text(["3", "4", "1"])
    })

    it("replaces first fragment with element", () => {
        let toggle = true;
        const root = v(() => v("div", toggle
            ? [ 
                [
                    v("p", "3"),
                    v("p", "4"),
                ],
                v("p", "1"),
            ]
            : [
                v("p", "1"),
                v("p", "2")
            ]));
        mount(getRootElement(), root);
        expect(document.querySelectorAll("p")).to.have.text(["3", "4", "1"])
        toggle = false;
        redraw(root)
        expect(document.querySelectorAll("p")).to.have.text(["1", "2"])
    })

    it("replaces second element with fragment", () => {
        let toggle = true;
        const root = v(() => v("div", toggle
            ? [ 
                v("p", "1"),
                [
                    v("p", "3"),
                    v("p", "4"),
                ],
            ]
            : [
                v("p", "1"),
                v("p", "2")
            ]));
        mount(getRootElement(), root);
        expect(document.querySelectorAll("p")).to.have.text(["1", "3", "4"])
        toggle = false;
        redraw(root)
        expect(document.querySelectorAll("p")).to.have.text(["1", "2"])
    })

    it("replaces fragment with fragment", () => {
        let toggle = true;
        const root = v(() => v("div", toggle
            ? [ 
                [
                    v("p", "1"),
                    v("p", "2"),
                ],
            ]
            : [
                [
                    v("p", "3"),
                    v("p", "4"),
                ],
            ]));
        mount(getRootElement(), root);
        expect(document.querySelectorAll("p")).to.have.text(["1", "2"])
        toggle = false;
        redraw(root)
        expect(document.querySelectorAll("p")).to.have.text(["3", "4"])
    })
});