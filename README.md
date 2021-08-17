# clvm_tools

Javascript implementation of clvm_tools (clvm = Chia Lisp VM)  
Still Work in progress.(Untested)  

**v0.x.x is test purpose only!**  
Please report bugs to https://github.com/Chia-Mine/clvm_tools-js/issues

## Install
```shell
npm install clvm_tools
# or
yarn add clvm_tools
```

## Quick examples
### Command line
```shell
$ npx clvm_tools run "(mod ARGUMENT (+ ARGUMENT 3))"
(+ 1 (q . 3))
```
```shell
$ npx clvm_tools brun "(+ 1 (q . 3))" "2"
5
```

### NodeJS
```javascript
const clvm_tools = require("clvm_tools");
clvm_tools.go("run", "(mod ARGUMENT (+ ARGUMENT 3))");
// Output: (+ 1 (q . 3))
clvm_tools.go("brun", "(+ 1 (q . 3))", "2");
// Output: 5
```


## clvm_tools license
`clvm_tools-js` is based on [clvm_tools](https://github.com/Chia-Network/clvm_tools) with the
[Apache license 2.0](https://github.com/Chia-Network/clvm_tools/blob/main/LICENSE)
