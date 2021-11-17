import { throwStatement } from "@babel/types";
import { parse, stringify, El, Attributes } from "html-parse-stringify";

export interface AttributesByTag {
  [key: string]: string[];
}

function stripNested(astPiece: El[], omit: string[]) {
  if (!astPiece) {
    return;
  }
  for (const tag of astPiece) {
    if (tag.type === "tag" && !!tag.name && !omit.includes(tag.name)) {
      tag.name = "remove";
    }
    if (tag.children) {
      stripNested(tag.children, omit);
    }
  }
}

export interface TraceInfo {
  original: string;
  ast: El[];
}

export class Prosaic {
  private ast: El[];

  constructor(private original: string) {
    this.ast = parse(this.original);
  }

  public trace(cb: (info: TraceInfo) => void): Prosaic {
    cb({
      original: this.original,
      ast: [...this.ast],
    });
    return this;
  }

  public flatten(omit?: string[]): Prosaic {
    for (const tag of this.ast) {
      if (tag.children) {
        stripNested(tag.children, omit || []);
      }
    }
    return this;
  }

  public rootParagraphs(): Prosaic {
    for (let i = 0; i < this.ast.length; i++) {
      const tag = this.ast[i];
      if (tag.type === "tag" && tag?.name === "div") {
        tag.type = "tag";
        tag.name = "p";
      } else if (tag.type === "text") {
        this.ast[i] = {
          type: "tag",
          name: "p",
          voidElement: false,
          attrs: {},
          children: [
            {
              type: "text",
              content: this.ast[i].content,
            },
          ],
        };
      }
    }
    return this;
  }

  public removeAttributes(omit?: AttributesByTag): Prosaic {
    const removeAttr = (tag: El) => {
      if (!tag) {
        return;
      }
      if (!omit) {
        delete tag.attrs;
      } else {
        if (omit) {
          tag.attrs = Object.keys(tag.attrs || [])
            .filter(
              (key) =>
                (omit[tag.name || ""] && omit[tag.name || ""].includes(key)) ||
                (omit["*"] && omit["*"].includes(key))
            )
            .reduce((obj: Attributes, key: string) => {
              if (tag && tag.attrs && tag.attrs[key]) {
                obj[key] = tag.attrs[key];
              }
              return obj;
            }, {});
        }
      }
      if (tag.children) {
        for (const child of tag.children) {
          removeAttr(child);
        }
      }
    };
    for (const tag of this.ast) {
      removeAttr(tag);
    }
    return this;
  }

  public rootPoint(attr: string, re: RegExp): Prosaic {
    const foo = this.getElementByAttrRegex(attr, re);
    console.log(foo);
    return this;
  }

  public result(tagsToStrip?: string[]): string {
    let res = stringify(this.ast).replace(/<(\/?|\!?)(remove)(\s*\/)?>/g, "");
    if (tagsToStrip) {
      for (const tag of tagsToStrip) {
        res = res.replace(new RegExp(`<(\/?|\!?)(${tag})>`, "g"), "");
      }
    }
    return res;
  }

  private getElementByAttrRegex(attr: string, re: RegExp): El | null {
    const res = [];
    const deepSearch = (el: El) => {
      for (const attr of Object.keys(el.attrs || {})) {
        if (attr.match(re)) {
          res.push(el);
        }
      }
      for (const child of el.children || []) {
        deepSearch(child);
      }
    };

    for (const tag of this.ast) {
      for (const attr of Object.keys(tag.attrs || {})) {
        if ((tag.attrs?[attr] || '').match(re)) {
          res.push(tag);
        }
      }
      for (const child of tag.children || []) {
        deepSearch(child);
      }
    }

    return res.length > 0 ? res[0] : null;
  }
}
