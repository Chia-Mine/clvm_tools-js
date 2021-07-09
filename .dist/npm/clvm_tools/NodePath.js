"use strict";
/*
We treat an s-expression as a binary tree, where leaf nodes are atoms and pairs
are nodes with two children. We then number the paths as follows:

              1
             / \
            /   \
           /     \
          /       \
         /         \
        /           \
       2             3
      / \           / \
     /   \         /   \
    4      6      5     7
   / \    / \    / \   / \
  8   12 10  14 9  13 11  15

etc.

You're probably thinking "the first two rows make sense, but why do the numbers
do that weird thing after?" The reason has to do with making the implementation simple.
We want a simple loop which starts with the root node, then processes bits starting with
the least significant, moving either left or right (first or rest). So the LEAST significant
bit controls the first branch, then the next-least the second, and so on. That leads to this
ugly-numbered tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RIGHT = exports.LEFT = exports.TOP = exports.NodePath = exports.compose_paths = void 0;
const clvm_1 = require("clvm");
function compose_paths(path_0, path_1) {
    /*
      The binary representation of a path is a 1 (which means "stop"), followed by the
      path as binary digits, where 0 is "left" and 1 is "right".
  
      Look at the diagram at the top for these examples.
  
      Example: 9 = 0b1001, so right, left, left
      Example: 10 = 0b1010, so left, right, left
  
      How it works: we write both numbers as binary. We ignore the terminal in path_0, since it's
      not the terminating condition anymore. We shift path_1 enough places to OR in the rest of path_0.
  
      Example: path_0 = 9 = 0b1001, path_1 = 10 = 0b1010.
      Shift path_1 three places (so there is room for 0b001) to 0b1010000.
      Then OR in 0b001 to yield 0b1010001 = 81, which is right, left, left, left, right, left.
     */
    let mask = 1;
    let temp_path = path_0;
    while (temp_path > 1) {
        path_1 <<= 1;
        mask <<= 1;
        temp_path >>= 1;
    }
    mask -= 1;
    return path_1 | (path_0 & mask);
}
exports.compose_paths = compose_paths;
class NodePath {
    constructor(index = 1) {
        this.as_path = this.as_short_path;
        if (index < 0) {
            index = index >>> 0;
        }
        this._index = index;
    }
    get index() {
        return this._index;
    }
    as_short_path() {
        const index = this._index;
        let hexStr = (index >>> 0).toString(16);
        if (index >= 0) {
            hexStr = hexStr.length % 2 ? `0${hexStr}` : hexStr;
        }
        return clvm_1.h(hexStr);
    }
    add(other_node) {
        const composedPath = compose_paths(this.index, other_node.index);
        return new NodePath(composedPath);
    }
    first() {
        return new NodePath(this.index * 2);
    }
    rest() {
        return new NodePath(this.index * 2 + 1);
    }
    toString() {
        return `NodePath: ${this.index}`;
    }
    __repl__() {
        return `NodePath: ${this.index}`;
    }
}
exports.NodePath = NodePath;
exports.TOP = new NodePath();
exports.LEFT = exports.TOP.first();
exports.RIGHT = exports.TOP.rest();
