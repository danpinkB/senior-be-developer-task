// jest.config.js
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    modulePathIgnorePatterns: ["./packages"],
    setupFiles: ["<rootDir>/setup-env.js"],
    moduleNameMapper: {
        // '^@utils/(.*)$': '<rootDir>/src/utils/$1',
        // '^@common/(.*)$': '<rootDir>/src/common/$1',
        "^src/(.*)$": "<rootDir>/src/$1",
    },
};
