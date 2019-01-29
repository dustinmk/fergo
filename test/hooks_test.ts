import chai, {expect} from "chai";
import * as sinon from "sinon";
import jsdom from "mocha-jsdom";
import {v, mount, redraw, redrawSync, selectRedraw, Vdom} from "src/index";
import chaiDOM from "chai-dom";
import {getRootElement, testMountCallbacks, testElementCallbacks} from "./test_common";

chai.use(chaiDOM);
selectRedraw(redrawSync);

describe("oninit and onremove: components", () => {
    jsdom({url: "http://localhost"});

    it("replaces with p", () => {
        testMountCallbacks("first", (toggle, component) => v("div", [
            !toggle ? component : v("p", "not component")
        ]));
    });

    it("replaces with functional", () => {
        testMountCallbacks("first", (toggle, component) => v("div", [
            !toggle ? component : () => v("hr")
        ]));
    });

    it("removes", () => {
        testMountCallbacks("first", (toggle, component) => v("div", [
            !toggle && component,
        ]));
    });

    it("adds", () => {
        testMountCallbacks("second", (toggle, component) => v("div", [
            toggle ? component : v(() => v("br"))
        ]))
    })

    it("calls onremove on child", () => {
        
    })

    it("doesn't call onremove when replaced with same", () => {
        
    })

    it("calls unmount on reduced size list", () => {})
    it("calls unmount on ignored keyed element", () => {})
});

describe("oninit and onremove: elements", () => {
    jsdom({url: "http://localhost"});

    it("replaces with same tag", () => {
        testElementCallbacks("same", (toggle: boolean, vdom: Vdom) => {
            return v("div", [
                !toggle ? vdom : v("p", "other")
            ])
        })
    })

    it("replaces with different tag", () => {
        testElementCallbacks("first", (toggle: boolean, vdom: Vdom) => {
            return v("div", [
                !toggle ? vdom : v("h1", "other")
            ])
        })
    })

    it("adds new element", () => {
        testElementCallbacks("second", (toggle: boolean, vdom: Vdom) => {
            return v("div", [
                toggle && vdom
            ])
        })
    })

    it("removes an element", () => {
        testElementCallbacks("first", (toggle: boolean, vdom: Vdom) => {
            return v("div", [
                !toggle && vdom
            ])
        })
    })

    it("calls onremove on child", () => {
        
    })

    it("calls onremove on reduced size list", () => {
        testElementCallbacks("first", (toggle: boolean, vdom: Vdom) => {
            return v("div", !toggle
                ? [vdom]
                : []
            )
        })
    })

    it("calls onremove on ignored keyed element", () => {
        const oninit = sinon.spy();
        const onremove = sinon.spy();
        const component = v("p", {oninit, onremove, key: "2"}, "text");

        let toggle = false;
        const root = v(() => v("div", !toggle
            ? [
                v("p", {key: "1"}, "1"),
                component,
                v("p", {key: "3"}, "3")
            ]
            : [
                v("p", {key: "1"}, "1"),
                v("p", {key: "3"}, "3")
            ]));

        mount(getRootElement(), root);
        expect(oninit.calledOnce).to.be.true;
        expect(onremove.called).to.be.false;

        toggle = true;
        redraw(root);
        expect(oninit.calledOnce).to.be.true;
        expect(onremove.calledOnce).to.be.true;
    });
})