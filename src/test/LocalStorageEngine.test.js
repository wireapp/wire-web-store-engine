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

import {LocalStorageEngine} from '../../dist/commonjs';

describe('LocalStorageEngine', () => {
  const DATABASE_NAME = 'database-name';
  const lse = new LocalStorageEngine(DATABASE_NAME);

  describe('"create"', () => {
    it('creates a stringified database record.', (done) => {
      const TABLE_NAME = 'table-name';
      const PRIMARY_KEY = 'primary-key';

      const entity = {
        some: 'value'
      };

      lse.create(TABLE_NAME, PRIMARY_KEY, entity).then((primaryKey) => {
        return lse.read(TABLE_NAME, primaryKey);
      }).then((entity) => {
        expect(entity.some).toBe('value');
        done();
      });
    });
  });
});
