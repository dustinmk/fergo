import chai, {expect} from "chai";
import jsdom from "mocha-jsdom";
import * as sinon from "sinon";
import {v, mount, redraw, redrawSync, selectRedraw, VdomFunctional} from "src/index";
import chaiDOM from "chai-dom";
import {getRootElement, mountAndMatch, redrawAndMatch} from "./test_common";

chai.use(chaiDOM);
selectRedraw(redrawSync);

describe("Components", () => {
    jsdom({url: "http://localhost"});

    it("Redraws a child component but not the parent", () => {
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

        mountAndMatch(parent, "p", ["parent", "first", "child", "first"]);

        text = "second";
        redrawAndMatch(child, "p", ["parent", "first", "child", "second"]);
    });

    it("Redraws a parent component but not the child", () => {
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

        mountAndMatch(parent, "p", ["parent", "first", "child", "first"]);

        text = "second";
        redrawAndMatch(parent, "p", ["parent", "second", "child", "first"]);
        expect(generator_spy.calledOnce).to.be.true;
    })

    it("Rebuilds a child component when parent updated", () => {
        let text = "first";

        const child = () => v(() =>
            v("div", [
                v("p", "child"),
                v("p", text)
            ])
        );

        const parent = v(() => v("div", [
            v("p", "parent"),
            v("p", text),
            child()
        ]));

        mountAndMatch(parent, "p", ["parent", "first", "child", "first"]);

        text = "second";
        redrawAndMatch(parent, "p", ["parent", "second", "child", "second"]);
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

        mountAndMatch(parent, "p", ["parent", "first", "middle", "first", "child", "first"]);

        text = "second";
        redrawAndMatch(middle, "p", ["parent", "first", "middle", "second", "child", "first"]);

        text = "third";
        redrawAndMatch(middle, "p", ["parent", "first", "middle", "third", "child", "first"]);
    })

    it("Redraws from a non-functional component after a redraw", () => {
        let text = "first";
        const redraw_component = v("p", "start here");

        mountAndMatch(() => v("div", [
            v("p", "parent"),
            v("p", text),
            v("div", [
                redraw_component
            ])
        ]), "p", ["parent", "first", "start here"]);

        text = "second";
        redrawAndMatch(redraw_component, "p", ["parent", "second", "start here"]);
    })

    it("Prevents redraw when props are not changed", () => {
        interface PropType {
            text: string;
        }

        let change_child = "change inner first";
        let change_outer = "change outer first";

        const child = (vdom: VdomFunctional<PropType>) => v("div", [
            v("p", vdom.props.text),
            v("p", change_child)
        ]);

        const root = v(() => v("div", [
            v(child, {props: {text: "text"}}),
            v("p", change_outer)
        ]))

        mountAndMatch(root, "p", ["text", "change inner first", "change outer first"])

        change_child = "change inner second";
        change_outer = "change outer second";
        redrawAndMatch(root, "p", ["text", "change inner first", "change outer second"]) 
    })

    it("Redraws child when props change", () => {
        interface PropType {
            text: string;
        }

        let props = {text: "first"};

        const child = (props: PropType) => v((vdom: VdomFunctional<PropType>) => v("div", [
            v("p", vdom.props.text),
        ]), {props, shouldUpdate});

        const shouldUpdate = (o: PropType, n: PropType) => o.text !== n.text;

        const root = v(() => v("div", [
            child(props),
            v("p", "root")
        ]))

        mountAndMatch(root, "p", ["first", "root"])

        props = {text: "second"};
        redrawAndMatch(root, "p", ["second", "root"]) 
    })

    it("Redraws child when generator changes", () => {
        interface PropType {
            text: string;
        }

        let props = {text: "text"};
        let toggle = false;
        const child1 = (vdom: VdomFunctional<PropType>) => v("div", [
            v("p", "child1"),
            v("p", vdom.props.text),
        ]);

        const child2 = (vdom: VdomFunctional<PropType>) => v("div", [
            v("p", "child2"),
            v("p", vdom.props.text),
        ]);

        const root = v(() => v("div", [
            v(toggle ? child2 : child1, {props}),
            v("p", "root")
        ]))

        mountAndMatch(root, "p", ["child1", "text", "root"])

        toggle = true;
        redrawAndMatch(root, "p", ["child2", "text", "root"]) 
    })

    it("Uses state", () => {
        interface StateType {
            count: number;
        }

        const generator = (vdom: VdomFunctional<{}, StateType>) => {
            vdom.state.count += 1;
            return v("p", `${vdom.state.count}`)
        }

        const child = v(generator, {state: {count: 0}});

        mountAndMatch(() => v("div", [
            v("h1", "root"),
            child,
        ]), "p", ["1"])
        redrawAndMatch(child, "p", ["2"])
        redrawAndMatch(child, "p", ["3"])
        redrawAndMatch(child, "p", ["4"])
    })

    it("Copies of stateful components have individual state", () => {
        interface StateType {
            count: number;
        }

        const generator = (vdom: VdomFunctional<{}, StateType>) => {
            if (vdom.state === null) {
                vdom.state = {count: 0}
            }

            return v("p", {
                onclick: () => {
                    vdom.state.count += 1
                }
            }, `${vdom.state.count}`)
        }

        const child = v(generator, {});

        const root = v(() => v("div", [
            v("h1", "root"),
            child,
            child,
            child
        ]));
        mountAndMatch(root, "p", ["0", "0", "0"])
        document.querySelectorAll("p").item(1).click();
        document.querySelectorAll("p").item(2).click();
        document.querySelectorAll("p").item(2).click();
        expect(document.querySelectorAll("p")).to.have.text(["0", "1", "2"])

        document.querySelectorAll("p").forEach(node => node.click());
        expect(document.querySelectorAll("p")).to.have.text(["1", "2", "3"])
    })

    it("Redraws on a copied component", () => {
        interface StateType {
            count: number;
        }

        const generator = (vdom: VdomFunctional<{}, StateType>) => {
            if (vdom.state === null) {
                vdom.state = {count: 0}
            } else {
                vdom.state.count += 1
            }

            return v("p", `${vdom.state.count}`)
        }

        const child = v(generator, {});

        let toggle = true;
        const root = v(() => v("div", 
            toggle
            ? [
                v("h1", "root"),
                child,
                child,
                child
            ]
            : [
                v("div", [
                    child,
                    child
                ])
            ]));
        mountAndMatch(root, "p", ["0", "0", "0"])
        redraw(child);
        expect(document.querySelectorAll("p")).to.have.text(["0", "0", "1"])

        // State is lost when element moved. This is similar behaviour to React
        toggle = false;
        redraw(root);
        expect(document.querySelectorAll("p")).to.have.text(["0", "0"])

        // Always assume last used copy of state is the one to redraw
        redraw(child);
        expect(document.querySelectorAll("p")).to.have.text(["0", "1"])
    })

    it("Passes generator children", () => {
        const component = (vdom: VdomFunctional<{}, {}>) => {
            return v("div", vdom.children);
        };

        mount(getRootElement(), v(component, {}, [
            v("p", "1"),
            v("p", "2")
        ]))
    })
})