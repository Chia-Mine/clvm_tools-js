# Typescript + Webpack

## Setup
```shell
pnpm install
pnpm build # ./.dist folder will be created
```

## Start web page
```shell
pnpm start
```

## Note
Unlike the typescript+react project, the browserslist in this project does not contain `node`
because it causes an error on building by incompatible output chunk format.
