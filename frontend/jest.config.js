export default {
	testEnvironment: "jsdom",
	setupFilesAfterEnv: ["@testing-library/jest-dom"],
	transform: {
		"^.+\\.(js|jsx)$": "babel-jest",
	},
};
