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
import { getChildElements } from '../utils.js';
import { firstChildIsText } from './utils.js';

function use(node) {
  if (firstChildIsText(node)) {
    return false;
  }
  const elements = getChildElements(node);
  if (elements.length === 1) {
    const { tagName } = elements[0];
    return tagName === 'h1' || tagName === 'h2' || tagName === 'h3'
      || tagName === 'h4' || tagName === 'h5' || tagName === 'h6';
  }
  return false;
}

function fields(idx, prefix = '') {
  return [
    {
      component: 'text',
      label: 'Title',
      name: `${prefix}title${idx}`,
      value: '',
      valueType: 'string',
    },
    {
      component: 'select',
      label: 'Title Type',
      name: `${prefix}title${idx}Type`,
      valueType: 'string',
      options: [
        { name: 'H1', value: 'h1' },
        { name: 'H2', value: 'h2' },
        { name: 'H3', value: 'h3' },
        { name: 'H4', value: 'h4' },
        { name: 'H5', value: 'h5' },
        { name: 'H6', value: 'h6' },
      ],
    },
  ];
}

const title = {
  use,
  fields,
};

export default title;
