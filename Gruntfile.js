module.exports = function (grunt) {
	require("time-grunt")(grunt);

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		// Java用プロジェクト構成向け設定
		opt: {
			client: {
				"tsMain": "lib",
				"tsMainLib": "lib/typings",
				"tsTest": "test/suite",
				"tsTestLib": "test/suite/libs",
				"peg": "resources",

				"outBase": "dist",
				"jsMainOut": "lib",
				"jsTestOut": "test"
			}
		},

		ts: {
			default: {
				tsconfig: {
					tsconfig: "./tsconfig.json",
					updateFiles:false
				}
			}
		},
		tsconfig: {
				main: {
				}
		},
		tslint: {
			options: {
				configuration: grunt.file.readJSON("tslint.json")
			},
			files: {
				src: [
					'<%= opt.client.tsMain %>/**/*.ts',
					'<%= opt.client.tsTest %>/**/*.ts',
					'!<%= opt.client.tsMain %>/**/*.d.ts'
				]
			}
		},
		dtsm: {
			client: {
				options: {
					// optional: specify config file
					confog: './dtsm.json'
				}
			}
		},
		dts_bundle: {
			build: {
				options: {
					name: "reviewjs-prh",
					main: "lib/index.d.ts",
					baseDir: "",
					out: "./reviewjs-prh.d.ts",
					prefix: '',
					exclude: function () {return false;},
					verbose: false
				}
			}
		},
		clean: {
			clientScript: {
				src: [
					// client
					'<%= opt.client.jsMainOut %>/**/*.js',
					'<%= opt.client.jsMainOut %>/**/*.d.ts',
					'<%= opt.client.jsMainOut %>/**/*.js.map',
					'!<%= opt.client.jsMainOut %>/typings/**/*.d.ts',
					// client test
					'<%= opt.client.jsTestOut %>/*.js',
					'<%= opt.client.jsTestOut %>/suite/**/*.js',
					'<%= opt.client.jsTestOut %>/suite/**/*.js.map',
					'<%= opt.client.jsTestOut %>/suite/**/*.d.ts',
					// peg.js
					'<%= opt.client.peg %>/grammar.js'
				]
			},
			dtsm: {
				src: [
					// dtsm installed
					"typings/"
				]
			}
		},
		mochaTest: {
			test: {
				options: {
					reporter: 'spec',
					require: [
						function () {
							require('espower-loader')({
								cwd: process.cwd() + '/' + grunt.config.get("opt.client.jsTestOut"),
								pattern: '**/*.js'
							});
						},
						function () {
							assert = require('power-assert');
						}
					]
				},
				src: [
					'<%= opt.client.jsTestOut %>/suite/indexSpec.js'
				]
			}
		}
	});

	grunt.registerTask(
		'setup',
		['clean', 'dtsm']);

	grunt.registerTask(
		'default',
		['clean:clientScript', 'tsconfig', 'ts', 'tslint']);

	grunt.registerTask(
		'test',
		['default', 'mochaTest']);

	require('load-grunt-tasks')(grunt);
};
