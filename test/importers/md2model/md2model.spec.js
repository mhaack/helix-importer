/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import path from 'path';
import fs from 'node:fs/promises';
import assert from 'assert';
import { fileURLToPath } from 'url';
import { describe, it } from 'mocha';
import { md2models } from '../../../src/importer/md2model/index.js';

// eslint-disable-next-line no-underscore-dangle
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function test(spec) {
  const md = await fs.readFile(path.resolve(__dirname, 'fixtures', `${spec}.md`), 'utf-8');
  let expected = md;
  try {
    expected = await fs.readFile(path.resolve(__dirname, 'fixtures', `${spec}.model.json`), 'utf-8');
    expected = JSON.parse(expected);
  } catch (e) {
    // ignore
  }
  const actual = await md2models(md);
  assert.deepStrictEqual(actual, expected);
}

describe('MD to Model converter', () => {
  it('converts a simple block', async () => {
    await test('simple');
  });
  it('converts a simple block with block classes', async () => {
    await test('simple-with-classes');
  });
  it('converts a simple block with code', async () => {
    await test('code');
  });
  it('converts a simple block with title', async () => {
    await test('simple-with-title');
  });
  it('converts a simple block with link', async () => {
    await test('simple-with-link');
  });
  it('converts a simple block with image', async () => {
    await test('simple-with-image');
  });
  it('converts a simple block with text', async () => {
    await test('simple-with-text');
  });
  it('converts a simple block with rich text', async () => {
    await test('simple-with-richtext');
  });
  it('converts a simple block with group', async () => {
    await test('simple-with-group');
  });
  it('converts a simple block with all content types', async () => {
    await test('simple-with-all');
  });
  it('converts a simple block with empty cell', async () => {
    await test('simple-with-empty');
  });
  it('converts a key-value block', async () => {
    await test('keyvalue');
  });
  it('converts a key-value block with block classes', async () => {
    await test('keyvalue-with-classes');
  });
  it('converts a container block', async () => {
    await test('container');
  });
  it('converts a container block with block classes', async () => {
    await test('container-with-classes');
  });
  it('converts a container block with group', async () => {
    await test('container-with-group');
  });
  it('converts a container block with parent properties', async () => {
    await test('container-with-properties');
  });
  it('converts an md file with multiple blocks', async () => {
    await test('multiple-blocks');
  });
});
