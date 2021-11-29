import { El, TagCond } from "./definitions";

const voids: TagCond = {
  area: true,
  base: true,
  br: true,
  col: true,
  embed: true,
  hr: true,
  img: true,
  input: true,
  link: true,
  meta: true,
  param: true,
  source: true,
  track: true,
  wbr: true,
};

const attrRE = /\s([^'"/\s><]+?)[\s/>]|([^\s=]+)=\s?(".*?"|'.*?')/g;

export default function parseTag(tag: string): El {
  const res: El = {
    type: "tag",
    name: "",
    voidElement: false,
    attrs: {},
    children: [],
  };

  const tagMatch = tag.match(/<\/?([^\s]+?)[/\s>]/);
  if (tagMatch) {
    res.name = tagMatch[1];
    if (voids[tagMatch[1]] || tag.charAt(tag.length - 2) === "/") {
      res.voidElement = true;
    }

    if (res.name.startsWith("!--")) {
      const endIndex = tag.indexOf("-->");
      return {
        type: "comment",
        comment: endIndex !== -1 ? tag.slice(4, endIndex) : "",
      };
    }
  }

  const reg = new RegExp(attrRE);
  let result = null;
  for (;;) {
    result = reg.exec(tag);

    if (result === null) {
      break;
    }

    if (!result[0].trim()) {
      continue;
    }

    if (!res.attrs) {
      res.attrs = {};
    }

    if (result[1]) {
      const attr = result[1].trim();
      let arr = [attr, ""];

      if (attr.indexOf("=") > -1) {
        arr = attr.split("=");
      }

      res.attrs[arr[0]] = arr[1];
      reg.lastIndex--;
    } else if (result[2]) {

      res.attrs[result[2]] = result[3].trim().substring(1, result[3].length - 1);
    }
  }

  return res;
}
