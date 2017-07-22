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

import {StoreEngine} from '../../../dist/commonjs';

describe('StoreEngine.IndexedDBEngine', () => {
  const DATABASE_NAME = 'database-name';
  const TABLE_NAME = 'the-simpsons';

  let engine = undefined;

  beforeEach(() => {
    const db = new Dexie(DATABASE_NAME);
    db.version(1).stores((
      obj = {},
        obj['' + TABLE_NAME] = ',firstName,lastName',
        obj
    ));
    engine = new StoreEngine.IndexedDBEngine(db);
  });

  afterEach(() => window.indexedDB.deleteDatabase(DATABASE_NAME));

  describe('"create"', () => {
    it('works.', (done) => {
      expect('A').toBe('A');
      done();
    });
  });
});
