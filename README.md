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
clvm_tools.run(["run", "(mod ARGUMENT (+ ARGUMENT 3))"]);
// Output: (+ 1 (q . 3))
clvm_tools.brun(["brun", "(+ 1 (q . 3))", "2"]);
// Output: 5
```


## Original clvm_tools written in python

https://github.com/Chia-Network/clvm_tools
