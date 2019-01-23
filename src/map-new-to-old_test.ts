import chai /*, {expect}*/ from "chai";
// import * as sinon from "sinon";
import jsdom from "mocha-jsdom";
// import {patchChildren} from "src/patch-children";
// import {v, Vdom} from "src/vdom";
import chaiDOM from "chai-dom";

chai.use(chaiDOM);

// TODO: Test onclick event handlers - replace, keep
// TODO: Test patch attributes

describe("Map new VDOM to old VDOM", () => {
    jsdom({url: "http://localhost"});

    it("Grows a fragment", () => {
        // const old_vdom = [
        //     v("p", "1"),
        //     v("p", "2"),
        //     makeFragment(mapN(5, (i) => v("p", `3-${i}`))),
        //     v("p", "4"),
        //     v("p", "5")
        // ]

        // const new_vdom = [
        //     v("p", "1"),
        //     v("p", "2"),
        //     makeFragment(mapN(8, (i) => v("p", `3-${i}`))),
        //     v("p", "4"),
        //     v("p", "5")
        // ]

        // const result = patchChildren(9, old_vdom, new_vdom);
    })
});

// function makeFragment(children: Vdom[]) {
//     return {
//         _type: "VdomFragment" as "VdomFragment",
//         parent: null,
//         children
//     }
// }

// function mapN<ReturnType>(n: number, map: (i: number) => ReturnType) {
//     const result: ReturnType[] = [];
//     for (let i = 0; i < n; ++i) {
//         result.push(map(i))
//     }
//     return result;
// }