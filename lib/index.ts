import * as ReVIEW from "review.js";
import * as prh from "prh";

import ReVIEWWalker = require("review.js/lib/parser/walker");

export class TextValidator implements ReVIEW.Validator {
    config: prh.Config;

    ignoreInlineNames = [
        "list",
        "img",
        "fn"
    ];
    ignoreBlockNames = [
        "list",
        "image"
    ];

    constructor(yamlPath: string) {
        this.config = prh.fromYAMLFilePath(yamlPath);
    }

    start(book: ReVIEW.Book) {
        book.predef.forEach(chunk=> this.checkChunk(chunk));
        book.contents.forEach(chunk=> this.checkChunk(chunk));
        book.appendix.forEach(chunk=> this.checkChunk(chunk));
        book.postdef.forEach(chunk=> this.checkChunk(chunk));
    }

    checkChunk(chunk: ReVIEW.ContentChunk) {
        let ignoreInlineStack: string[] = [];
        let ignoreBlockStack: string[] = [];
        ReVIEWWalker.visit(chunk.tree.ast, {
            visitDefaultPre: (node: ReVIEW.SyntaxTree) => {
            },
            visitInlineElementPre: (node: ReVIEW.InlineElementSyntaxTree, parent: ReVIEW.SyntaxTree) => {
                if (this.ignoreInlineNames.indexOf(node.symbol) !== -1) {
                    ignoreInlineStack.push(node.symbol);
                }
            },
            visitInlineElementPost: (node: ReVIEW.InlineElementSyntaxTree, parent: ReVIEW.SyntaxTree) => {
                if (this.ignoreInlineNames.indexOf(node.symbol) !== -1) {
                    ignoreInlineStack.pop();
                }
            },
            visitBlockElementPre: (node: ReVIEW.BlockElementSyntaxTree, parent: ReVIEW.SyntaxTree) => {
                if (this.ignoreBlockNames.indexOf(node.symbol) !== -1) {
                    ignoreBlockStack.push(node.symbol);
                }
            },
            visitBlockElementPost: (node: ReVIEW.BlockElementSyntaxTree, parent: ReVIEW.SyntaxTree) => {
                if (this.ignoreBlockNames.indexOf(node.symbol) !== -1) {
                    ignoreBlockStack.pop();
                }
            },

            visitTextPre: (node: ReVIEW.TextNodeSyntaxTree) => {
                if (ignoreInlineStack.length !== 0 || ignoreBlockStack.length !== 0) {
                    return;
                }
                // 現在がParagraphの中なら親(Paragraph)の兄を取るとコメントの可能性がある
                let prev = node.parentNode.prev;
                if (prev instanceof ReVIEW.SingleLineCommentSyntaxTree) {
                    if (prev.text.indexOf("prh:disable") !== -1) {
                        return;
                    }
                }

                let text = chunk.input.substring(node.location.start.offset, node.location.end.offset);
                let changeSets = this.config.makeChangeSet(chunk.name, text);
                changeSets.forEach(changeSet => {
                    let result = changeSet.expected.replace(/\$([0-9]{1,2})/g, (match: string, g1: string) => {
                        let index = parseInt(g1);
                        if (index === 0 || (changeSet.matches.length - 1) < index) {
                            return match;
                        }
                        return changeSet.matches[index] || "";
                    });
                    if (result === changeSet.matches[0]) {
                        return;
                    }

                    let message: string;
                    if (changeSet.rule.raw.prh) {
                        message = `'${result}' ${changeSet.rule.raw.prh}`;
                    } else {
                        message = result;
                    }
                    chunk.process.warn(message, getNodeLocation(node, changeSet.index, changeSet.matches[0].length));
                });
            }
        });

        function getNodeLocation(node: ReVIEW.SyntaxTree, targetIndex: number, targetLength: number): ReVIEW.NodeLocation {
            return {
                location: {
                    start: {
                        line: node.location.start.line,
                        column: node.location.start.column + targetIndex,
                        offset: node.location.start.offset + targetIndex,
                    },
                    end: {
                        line: node.location.start.line,
                        column: node.location.start.column + targetIndex + targetLength,
                        offset: node.location.start.offset + targetIndex + targetLength,
                    }
                }
            };
        }
    }
}
