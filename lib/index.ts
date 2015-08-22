import * as ReVIEW from "review.js";
import * as prh from "prh";

import ReVIEWWalker = require("review.js/lib/parser/walker");

export class TextValidator implements ReVIEW.Validator {
    config: prh.Config;

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
        ReVIEWWalker.visit(chunk.tree.ast, {
            visitDefaultPre: (node: ReVIEW.SyntaxTree) => {
            },
            visitTextPre: (node: ReVIEW.TextNodeSyntaxTree) => {
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
                    chunk.process.warn(result, getNodeLocation(node, changeSet.index, changeSet.matches[0].length));
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
