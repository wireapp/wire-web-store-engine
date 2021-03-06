/*
 * Wire
 * Copyright (C) 2017 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */

const dist = 'dist/';
const test = 'src/test/';

const preprocessors = {};
preprocessors['**/*.js'] = ['sourcemap'];

module.exports = function(config) {
  config.set({
    autoWatch: false,
    basePath: '',
    browsers: ['Chrome_Headless'],
    client: {
      useIframe: false,
    },
    colors: true,
    concurrency: Infinity,
    customLaunchers: {
      Chrome_Headless: {
        base: 'Chrome',
        flags: ['--headless', '--disable-gpu', '--remote-debugging-port=9222'],
      },
    },
    files: [
      `${dist}test-bundle.js`
    ],
    frameworks: ['jasmine'],
    logLevel: config.LOG_INFO,
    port: 9876,
    preprocessors,
    reporters: ['jasmine-diff', 'progress'],
    singleRun: true,
  });
};
