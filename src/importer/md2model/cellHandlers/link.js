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
    return tagName === 'a';
  }
  return false;
}

function fields(idx, prefix = '') {
  return [
    {
      component: 'aem-content',
      label: 'Link',
      name: `${prefix}link${idx}`,
      valueType: 'string',
    },
    {
      component: 'select',
      label: 'Link Type',
      name: `${prefix}link${idx}Type`,
      valueType: 'string',
      options: [
        { name: 'Default', value: 'default' },
        { name: 'Primary', value: 'primary' },
        { name: 'Secondary', value: 'secondary' },
      ],
    },
    {
      component: 'text',
      label: 'Link Text',
      name: `${prefix}link${idx}Text`,
      valueType: 'string',
    },
    {
      component: 'text',
      label: 'Link Title',
      name: `${prefix}link${idx}Title`,
      value: '',
      valueType: 'string',
    },
  ];
}

const link = {
  use,
  fields,
};

export default link;
