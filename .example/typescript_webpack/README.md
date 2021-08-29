# Typescript + Webpack

## Setup
```shell
npm install
npm run build # ./dist folder will be created
```

## Start web page
```shell
npm run start
```

## Note
Unlike typescript+react project, the browserslist in this project does not contain `node`
because it causes error on building by incompatible output chunk format.
```
  "browserslist": [
    "edge >= 79",
    "firefox >= 68",
    "chrome >= 67",
    "safari > 14",
    "opera >= 54",
    "ios_saf >= 14.4",
    "android >= 67",
    "op_mob >= 48",
    "and_chr >= 67",
    "and_ff >= 68",
    "samsung >= 9.2",
    "node >= 10.4.0", <-- This line does not exist in this project.
    "electron >= 4.0.0"
  ]
```