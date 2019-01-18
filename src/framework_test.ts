import chai, {expect} from "chai";
import * as sinon from "sinon";
import jsdom from "mocha-jsdom";
import {v, mount, redraw, redrawSync, selectRedraw, Vdom} from "src/index";
import chaiDOM from "chai-dom";
import beautify from "js-beautify";
import { UserVdom } from "./vdom";

chai.use(chaiDOM);
selectRedraw(redrawSync);

// TODO: Test remove hooks
// TODO: Test onclick event handlers - replace, keep
// TODO: Test patch attributes

const PRINT_HTML = false;

describe("Framework Test", () => {
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

        children = [c2, c1, c3];
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

    it("Redraws from passed in vdom", () => {
        let text = "first";
        let root: UserVdom | null = null;

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
        interface PropType {
            text: string;
        }

        let change_child = "change inner first";
        let change_outer = "change outer first";

        const child = (vdom: UserVdom<PropType>) => v("div", [
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

        const child = (props: PropType) => v((vdom: UserVdom<PropType>) => v("div", [
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
        const child1 = (vdom: UserVdom<PropType>) => v("div", [
            v("p", "child1"),
            v("p", vdom.props.text),
        ]);

        const child2 = (vdom: UserVdom<PropType>) => v("div", [
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

        const generator = (vdom: UserVdom<{}, StateType>) => {
            vdom.state.count += 1;
            return v("p", `${vdom.state.count}`)
        }

        const child = v(generator, {state: {count: 0}});

        mountAndMatch(() => v("div", [
            v("h1", "root"),
            child
        ]), "p", ["1"])
        redrawAndMatch(child, "p", ["2"])
        redrawAndMatch(child, "p", ["3"])
        redrawAndMatch(child, "p", ["4"])
    })


    describe("Mount and Unmount", () => {
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

        it("calls unMount on child", () => {
            
        })
    });

    describe("oninit and onremove hooks", () => {
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
    })
});

function testMountCallbacks(when_mounted: string, root_generator: (toggle: boolean, component: Vdom) => Vdom) {
    interface State {
        name: string;
    }

    const state = {name: "0"};
    const generator = () => v("p", "component");
    const onMount = sinon.spy((_: State) => {})
    const onUnmount = sinon.spy((_: State) => {})
    const component = v(generator, {
        onMount: onMount,
        onUnmount: onUnmount,
        state: state
    })

    let toggle = false;
    const root = v(() => root_generator(toggle, component));

    if (when_mounted === "first") {
        mount(getRootElement(), root);
        expect(onMount.calledWith(component), "onMount called").to.be.true;
        expect(onUnmount.notCalled, "onUnmount not called").to.be.true;

        toggle = true;
        redraw(root);
        expect(onUnmount.calledWith(component), "onUnmount called").to.be.true;
        expect(onMount.calledOnce, "onMount not called").to.be.true;

    } else {
        mount(getRootElement(), root);
        expect(onMount.notCalled, "onMount not called").to.be.true;
        expect(onUnmount.notCalled, "onUnmount not called").to.be.true;

        toggle = true;
        redraw(root);
        expect(onUnmount.notCalled, "onUnmount not called").to.be.true;
        expect(onMount.calledWith(component), "onMount not called").to.be.true;
    }
}

function testElementCallbacks(when_mounted: string, root_generator: (toggle: boolean, component: Vdom) => Vdom) {
    const oninit = sinon.spy();
    const onremove = sinon.spy();
    const component = v("p", {oninit, onremove}, "text");

    let toggle = false;
    const root = v(() => root_generator(toggle, component));

    if (when_mounted === "first") {
        mount(getRootElement(), root);
        expect(oninit.calledOnce).to.be.true;
        expect(onremove.called).to.be.false;

        toggle = true;
        redraw(root);
        expect(oninit.calledOnce).to.be.true;
        expect(onremove.calledOnce).to.be.true;
    
    } else if (when_mounted === "second") {
        mount(getRootElement(), root);
        expect(oninit.notCalled).to.be.true;
        expect(onremove.notCalled).to.be.true;

        toggle = true;
        redraw(root);
        expect(oninit.calledOnce).to.be.true;
        expect(onremove.notCalled).to.be.true;

    } else if (when_mounted === "same") {
        mount(getRootElement(), root);
        expect(oninit.calledOnce).to.be.true;
        expect(onremove.notCalled).to.be.true;

        toggle = true;
        redraw(root);
        expect(oninit.calledOnce).to.be.true;
        expect(onremove.notCalled).to.be.true;
    }

}

function mountAndMatch(vdom: Vdom | ((vdom: UserVdom<any, any>) => Vdom), tag: string, result: string[]) {
    mount(getRootElement(), vdom);
    PRINT_HTML && printDocument();
    expect(document.querySelectorAll(tag))
        .to.have.text(result);
}

function redrawAndMatch(vdom: Vdom, tag: string, result: string[]) {
    redraw(vdom);
    PRINT_HTML && printDocument();
    expect(document.querySelectorAll(tag))
        .to.have.text(result);
}

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