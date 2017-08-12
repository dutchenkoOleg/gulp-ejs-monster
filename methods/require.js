'use strict';

/**
 * @module
 * @author Oleg Dutchenko <dutchenko.o.dev@gmail.com>
 * @version 1.0.0
 * @requires utils/file-cache
 */

// ----------------------------------------
// Imports
// ----------------------------------------

const path = require('path');
const chalk = require('chalk');

const createFileCache = require('../utils/file-cache');

// ----------------------------------------
// Public
// ----------------------------------------

/**
 * [FW] Create `[localsName].require()` method
 * Requiring extensions:
 *  - `.js`
 *  - `.json`
 *  - `.md`
 *
 * @param {Object} options - plugin options
 * @param {string} options.requires - resolved path to the "requires" folder
 * @param {Object} options.ejs - ejs render options
 * @param {DataStorage} storage
 * @returns {Function}
 * @sourceCode
 */
function createRequireMethod (options, storage) {
	const folder = options.requires;
	const cached = createFileCache(storage);
	const extnames = ['.json', '.js', '.md'];

	/**
	 * @param {string} resolvedPath
	 * @param {boolean} noCache
	 * @returns {Object}
	 * @private
	 */
	function requireJsAndJsonFiles (resolvedPath, noCache) {
		let result = null;

		if (noCache) {
			delete require.cache[resolvedPath];
			storage.push(chalk.gray('  no cache'));
			result = require(resolvedPath);
			delete require.cache[resolvedPath];
		} else {
			let data = cached(resolvedPath, false, true);

			if (data.changed) {
				delete require.cache[resolvedPath];
			}
			storage.push(chalk.gray(data.changed ? '√ file changed' : '< file not changed'), false, '>');
			result = require(resolvedPath);
		}

		return result;
	}

	/**
	 * @param {string} resolvedPath
	 * @param {boolean} noCache
	 * @returns {string}
	 * @private
	 */
	function requireMarkdownFile (resolvedPath, noCache) {
		let markdown = require('markdown').markdown;
		let data = cached(resolvedPath, noCache);

		storage.push(chalk.gray(data.changed ? '√ file changed' : '< file not changed'), false, '>');
		if (data.changed) {
			data.content = markdown.toHTML(data.content);
			storage.push(chalk.gray('set in cache new rendered content from markdown into html'));
		} else {
			storage.push(chalk.gray('get early rendered html content'));
		}

		return data.content;
	}

	/**
	 * require method
	 * @param {string} filePath - relative path to the file, without extension
	 * @param {boolean} [noCache] - don't cache file contents
	 * @returns {string}
	 */
	function requireFn (filePath, noCache) {
		if (!filePath || typeof filePath !== 'string') {
			throw new Error('require without filePath');
		}
		if (/\.ejs$/.test(filePath)) {
			throw new Error(`requiring *.ejs file → "${filePath}"\nuse partial() or layout() methods for this files`);
		}

		let extname = path.extname(filePath);
		let result = '';

		if (!extname) {
			try {
				storage.push('> requiring module', false, '>>');
				if (require.cache[require.resolve(filePath)]) {
					storage.push(chalk.gray('  module is cached'));
				}
				result = require(filePath);
			} catch (error) {
				throw new Error(error.message);
			}

			storage.indent('<<');
			return result;
		}

		if (!~extnames.indexOf(extname)) {
			throw new Error(`requiring *${extname} file → "${filePath}"\nthis extension not available for requiring`);
		}
		let resolvedPath = path.join(folder, filePath);

		storage.push('> requiring file', resolvedPath, '>>');
		switch (extname) {
			case '.js':
			case '.json':
				result = requireJsAndJsonFiles(resolvedPath, noCache);
				break;
			case '.md':
				result = requireMarkdownFile(resolvedPath, noCache);
				break;
			default:
				throw new Error(`requiring unknown extension "${extname}"`);
		}

		storage.indent('<<<');
		return result;
	}

	return requireFn;
}

// ----------------------------------------
// Exports
// ----------------------------------------

module.exports = createRequireMethod;
