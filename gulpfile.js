'use strict';

/**
 * @fileOverview Testing
 * @author Oleg Dutchenko <dutchenko.o.dev@gmail.com>
 * @version 1.0.0
 */

// ----------------------------------------
// Imports
// ----------------------------------------

// modules
const gulp = require('gulp');
const mocha = require('gulp-mocha');
const argv = require('yargs').argv;

// plugin
const ejsMonster = require('./index');

// ----------------------------------------
// Private
// ----------------------------------------

/**
 * Debugging flag
 * @const {boolean}
 * @private
 */
const debugFlag = !!argv.debug;

/**
 * Production flag
 * @const {boolean}
 * @private
 */
const prodFlag = !!argv.p || !!argv.production;

/**
 * Plugin user options
 * @const {Object}
 * @private
 */
const ejsOptions = {
	beautify: prodFlag,
	debug: debugFlag,
	ejs: {
		compileDebug: debugFlag,
		delimiter: '%',
		localsName: 'locals',
		locals: {
			customProp: 'customProp'
		}
	}
};

// ----------------------------------------
// Tasks
// ----------------------------------------

gulp.task('ejs', function () {
	return gulp.src('./examples/src/*.ejs')
		.pipe(ejsMonster(ejsOptions).on('error', ejsMonster.preventCrash))
		.pipe(gulp.dest('./examples/dist/'));
});

gulp.task('watch', gulp.series('ejs', function () {
	gulp.watch('./examples/src/*.ejs', gulp.series('ejs'));
}));

gulp.task('test-setup-options', function () {
	return gulp.src('./tests/setup-options.js', {read: false})
		.pipe(mocha({
			reporter: 'spec'
		}))
		.once('error', () => {
			process.exit(1);
		});
});
