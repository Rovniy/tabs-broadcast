export default {
	transform: {
		'^.+\\.jsx?$': 'babel-jest'
	},
	testEnvironment: 'node',
	moduleNameMapper: {
		'^(\\.{1,2}/.*)\\.js$': '$1',
	},
	collectCoverage: true,
	coverageDirectory: 'coverage',
	coverageReporters: [ 'json', 'lcov', 'text', 'clover' ]
};
