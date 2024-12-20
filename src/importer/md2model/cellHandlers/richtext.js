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
  const elements = getChildElements(node);
  // if one element is an image, it is not richtext
  if (elements.some((el) => el.tagName === 'img')) {
    return false;
  }
  if (firstChildIsText(node)) {
    return true;
  }
  if (elements.length === 0) {
    // if there are no elements, it is richtext
    return true;
  }
  if (elements.length === 1) {
    const { tagName } = elements[0];
    return tagName === 'pre';
  }
  return false;
}

function fields(idx, prefix = '') {
  return [
    {
      component: 'richtext',
      name: `${prefix}text${idx}`,
      value: '',
      label: 'Text',
      valueType: 'string',
    },
  ];
}

const richtext = {
  use,
  fields,
};

export default richtext;
