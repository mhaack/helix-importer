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
import title from './title.js';
import link from './link.js';
import image from './image.js';
import richtext from './richtext.js';

function use(node) {
  const elements = getChildElements(node);
  return elements.length > 1;
}

function fields(idx, prefix = '', node) {
  const cellItems = getChildElements(node);
  let fieldIdx = 0;
  return cellItems.flatMap((cellItem) => {
    const { tagName } = cellItem;
    // if the cell item is a title, create a title field
    if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3'
      || tagName === 'h4' || tagName === 'h5' || tagName === 'h6') {
      fieldIdx += 1;
      return title.fields(fieldIdx, `content${idx}_`);
    }
    // if the cell item is a link, create a link field
    if (tagName === 'a') {
      return link.fields(fieldIdx, `content${idx}_`);
    }
    // if the cell item is an image, create an image field
    if (tagName === 'img') {
      return image.fields(fieldIdx, `content${idx}_`);
    }
    // if the cell item is a paragraph, assess the paragraph children to create the fields
    if (tagName === 'p') {
      const { children } = cellItem;
      const pFields = [];
      for (let i = 0; i < children.length; i += 1) {
        const child = children[i];
        const nextChild = (i < children.length - 1) ? children[i + 1] : null;
        if (child.tagName === 'img') {
          // if the child is an image, create an image field
          fieldIdx += 1;
          pFields.push(...image.fields(fieldIdx, `content${idx}_`));
        } else if (child.type === 'text'
          && child.value.trim().length === 0
          && nextChild && nextChild.tagName === 'a') {
          // if the child is an empty text and the next child is a link, create a link field
          fieldIdx += 1;
          pFields.push(...link.fields(fieldIdx, `content${idx}_`));
          i += 1;
        } else if (child.type === 'text' && child.value.trim().length > 0) {
          // if any subsequent element is an image or an empty text node, create a richtext field
          let hasImage = false;
          let hasEmptyText = false;
          for (let j = i + 1; j < children.length; j += 1) {
            const next = children[j];
            i = j - 1;
            if (next.tagName === 'img') {
              hasImage = true;
              break;
            }
            if (next.type === 'text' && next.value.trim().length === 0) {
              hasEmptyText = true;
              break;
            }
          }
          if (hasImage || hasEmptyText || i === children.length - 1) {
            fieldIdx += 1;
            pFields.push(...richtext.fields(fieldIdx, `content${idx}_`));
          }
        }
      }
      return pFields;
    }
    throw new Error(`Unsupported cell type: ${cellItem.tagName}`);
  });
}

const group = {
  use,
  fields,
};

export default group;
