import chai from "chai";
import jsdom from "mocha-jsdom";
import {v, redrawSync, selectRedraw} from "src/index";
import chaiDOM from "chai-dom";
import {mountAndMatch, redrawAndMatch} from "./test_common";

chai.use(chaiDOM);
selectRedraw(redrawSync);

describe("Fastpath", () => {
    jsdom({url: "http://localhost"});

    it("Replaces keyed elements", () => {
        const keys = [1, 2, 3, 4];
        let offset = 0;
        const root = v(() => v("ul", keys.map(k => v("li", {key: k}, `${k + offset}`))
        ))
        mountAndMatch(root, "li", ["1", "2", "3", "4"]);
        offset = 4;
        redrawAndMatch(root, "li", ["5", "6", "7", "8"]);
    });

    it("Appends keyed elements", () => {
        const keys = [1, 2, 3, 4, 5, 6];
        let count = 4;
        const root = v(() => v("ul", keys
            .filter((_, i) => i < count)
            .map(k => v("li", {key: k}, `${k}`))
        ))
        mountAndMatch(root, "li", ["1", "2", "3", "4"]);
        count = 6;
        redrawAndMatch(root, "li", ["1", "2", "3", "4", "5", "6"]);
    });
});

