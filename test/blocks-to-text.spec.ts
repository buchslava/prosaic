import * as chai from "chai";

import { TagTide } from "../src/index";

const expect = chai.expect;

describe("text transformation", () => {
  it("blocks to text", () => {
    const html = "<p>foo</p><p>1 2 3</p><p> middle </p><p>4 5</p>";
    const content = new TagTide(html).blocksToText();
    const expected = ["foo", "1 2 3", " middle ", "4 5"];

    expect(content).to.deep.equal(expected);
  });

  it("mnemonic processing", () => {
    const html = "<p>aaa &mdash; bbb&ndash;ccc</p>";
    const content = (new TagTide(html).blocksToText()).map(el => TagTide.stripDashes(el));
    const expected = ["aaa - bbb-ccc"];

    expect(content).to.deep.equal(expected);
  });
});
