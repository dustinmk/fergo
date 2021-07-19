import chai, {expect} from "chai";
import {splitSelector} from "src/vdom";
import chaiDOM from "chai-dom";

chai.use(chaiDOM);

describe("Selector", () => {
    it("finds empty tag", () => {
        const split = splitSelector("p")
        expect(split).to.include({id: undefined, tag: "p", classes: ""})
    })

    it("find long tag", () => {
        const split = splitSelector("table");
        expect(split).to.include({id: undefined, tag: "table", classes: ""})
    })

    it("finds empty class", () => {
        const split = splitSelector(".red");
        expect(split).to.include({id: undefined, tag: "div", classes: "red"})
    })

    it("finds empty id", () => {
        const split = splitSelector("#id");
        expect(split).to.include({id: "id", tag: "div", classes: ""})
    })

    it("finds multiple classes", () => {
        const split = splitSelector(".red.message_box.alert");
        expect(split).to.include({id: undefined, tag: "div", classes: "red message_box alert"})
    })

    it("mixes all three", () => {
        const split = splitSelector("p#username.red.dropshadow");
        expect(split).to.include({id: "username", tag: "p", classes: "red dropshadow"})
    })

    it("mixes all three again", () => {
        const split = splitSelector("table.red#username.dropshadow");
        expect(split).to.include({id: "username", tag: "table", classes: "red dropshadow"})
    })
});