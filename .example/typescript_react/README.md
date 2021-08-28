# Typescript + React

## Setup
```shell
yarn
yarn build
# or
npm install
npm run build
```

## Start web page
```shell
yarn start
# or
npm run start
```

## Memo - How to set up react+typescript project from scratch
```shell
npx create-react-app some-project --template typescript
cd some-project
yarn add clvm_tools
```
Then copy wasm files from npm package.
```shell
mkdir -p ./public/static/js
cp ./node_modules/clvm_tools/browser/*.wasm ./public/static/js
```
