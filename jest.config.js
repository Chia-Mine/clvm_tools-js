/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  modulePathIgnorePatterns: ["<rootDir>/build", "<rootDir>/dist"],
  testEnvironment: "node",
  testMatch: ["<rootDir>/test/**/*.spec.ts"],
};