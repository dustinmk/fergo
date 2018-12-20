import chai, {expect} from "chai";
import jsdom from "mocha-jsdom";
import {v, mount, redraw} from "src/framework";
import chaiDOM from "chai-dom";

chai.use(chaiDOM);

describe("test test", () => {
    jsdom({url: "http://localhost"});

    it("tests", () => {
        document.body.innerHTML = `<h1>This is text</h1>`;
        expect((<Element>document.body.children.item(0)).innerHTML).to.equal("This is text");
    });

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
        console.log(html);
    }
}