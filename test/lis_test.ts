import chai, {expect} from "chai";
import lis from "src/longest-increasing-subsequence";
import chaiDOM from "chai-dom";

chai.use(chaiDOM);

describe("Longest increasing subsequence", () => {
    it("Finds the lis", () => {
        expect(lis([0, 8, 4, 12, 2, 10, 6, 14, 1, 9, 5, 13, 3, 11, 7, 15]))
            .to.deep.equal([0, 2, 6, 9, 11, 15]);
    });

    it("Is okay with empty list", () => {
        expect(lis([])).to.deep.equal([]);
    });

    // TODO: Test with -1
});