/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  modulePathIgnorePatterns: ["<rootDir>/build", "<rootDir>/dist"],
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*_test.ts"],
  collectCoverage: false,
  globals: {
    "ts-jest": {
      tsConfig: {
        sourceMap: true,
        inlineSourceMap: true,
      }
    },
  },
};