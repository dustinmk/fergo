import chai, {expect} from "chai";
import {splitSelector} from "src/vdom";
import chaiDOM from "chai-dom";

chai.use(chaiDOM);

describe("Selector", () => {
    it("finds empty tag", () => {
        const split = splitSelector("p")
        expect(split).to.deep.equal({id: undefined, tag: "p", classes: {}})
    })

    it("find long tag", () => {
        const split = splitSelector("table");
        expect(split).to.deep.equal({id: undefined, tag: "table", classes: {}})
    })

    it("finds empty class", () => {
        const split = splitSelector(".red");
        expect(split).to.deep.equal({id: undefined, tag: "div", classes: {red: "red"}})
    })

    it("finds empty id", () => {
        const split = splitSelector("#id");
        expect(split).to.deep.equal({id: "id", tag: "div", classes: {}})
    })

    it("finds multiple classes", () => {
        const split = splitSelector(".red.message_box.alert");
        expect(split).to.deep.equal({id: undefined, tag: "div", classes: {
            red: "red",
            message_box: "message_box",
            alert: "alert"
        }})
    })

    it("mixes all three", () => {
        const split = splitSelector("p#username.red.dropshadow");
        expect(split).to.deep.equal({id: "username", tag: "p", classes: {
            red: "red",
            dropshadow: "dropshadow"
        }})
    })

    it("mixes all three again", () => {
        const split = splitSelector("table.red#username.dropshadow");
        expect(split).to.deep.equal({id: "username", tag: "table", classes: {
            red: "red",
            dropshadow: "dropshadow"
        }})
    })
});