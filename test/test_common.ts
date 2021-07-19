import chai, {expect} from "chai";
import * as sinon from "sinon";
import {v, mount, redraw, Vdom, VdomFunctional} from "src/index";
import chaiDOM from "chai-dom";
import beautify from "js-beautify";

chai.use(chaiDOM);

const PRINT_HTML = false;

export function testMountCallbacks(when_mounted: string, root_generator: (toggle: boolean, component: Vdom) => Vdom) {
    interface State {
        name: string;
    }

    const state = {name: "0"};
    const generator = () => v("p", "component");
    const onMount = sinon.spy((_: State) => {})
    const onUnmount = sinon.spy((_: State) => {})
    const component = v(generator, {
        oninit: onMount,
        onremove: onUnmount,
        state: state
    })

    let toggle = false;
    const root = v(() => root_generator(toggle, component));

    if (when_mounted === "first") {
        mount(getRootElement(), root);
        expect(onMount.calledWith(sinon.match.has("state", state)), "onMount called").to.be.true;
        expect(onUnmount.notCalled, "onUnmount not called").to.be.true;

        toggle = true;
        redraw(root);
        expect(onUnmount.calledWith(sinon.match.has("state", state)), "onUnmount called").to.be.true;
        expect(onMount.calledOnce, "onMount not called").to.be.true;

    } else {
        mount(getRootElement(), root);
        expect(onMount.notCalled, "onMount not called").to.be.true;
        expect(onUnmount.notCalled, "onUnmount not called").to.be.true;

        toggle = true;
        redraw(root);
        expect(onUnmount.notCalled, "onUnmount not called").to.be.true;
        expect(onMount.calledWith(sinon.match.has("state", state)), "onMount not called").to.be.true;
    }
}

export function testElementCallbacks(when_mounted: string, root_generator: (toggle: boolean, component: Vdom) => Vdom) {
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

export function mountAndMatch(vdom: Vdom | ((vdom: VdomFunctional<any, any>) => Vdom), tag: string, result: string[]) {
    mount(getRootElement(), vdom);
    PRINT_HTML && printDocument();
    expect(document.querySelectorAll(tag))
        .to.have.text(result);
}

export function redrawAndMatch(vdom: Vdom, tag: string, result: string[]) {
    redraw(vdom);
    PRINT_HTML && printDocument();
    expect(document.querySelectorAll(tag))
        .to.have.text(result);
}

export function getRootElement() {
    document.body.innerHTML = `<div id="root"></div>`;
    let root = document.getElementById("root");
    if (root === null) {
        throw new Error("Root element not found.");
    }
    return root;
}

export function printDocument() {
    const body = document.querySelector("body");
    if(body !== null) {
        const html = body.outerHTML;
        console.log(beautify.html(html));
    }
}