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
import {
  getBlockName,
  getClassesField,
  getModelDefinition,
  toCamelCase,
} from './utils.js';
import { getChildElements } from '../utils.js';

function createModel(node) {
  const blockName = getBlockName(node);
  const rows = getChildElements(node);
  const fields = rows.map((row) => {
    const cells = getChildElements(row);
    const label = cells[0].children[0].value;
    // get the camel case version of the label
    const name = toCamelCase(label);
    return {
      component: 'text',
      name,
      label,
    };
  });
  const classesField = getClassesField(node);
  if (classesField) {
    // insert the classes field at the beginning of the fields array
    fields.unshift(classesField);
  }
  return {
    filters: [],
    definition: {
      groups: [
        {
          title: 'Blocks',
          id: 'blocks',
          components: [
            getModelDefinition(blockName, true),
          ],
        },
      ],
    },
    models: [
      {
        id: blockName,
        fields,
      },
    ],
  };
}

function use(node) {
  // has 1 to n rows
  const rows = getChildElements(node);
  if (rows.length === 0) {
    return false;
  }
  // each row has 2 cells
  if (rows.some((row) => {
    const cells = getChildElements(row);
    return cells.length !== 2;
  })) {
    return false;
  }
  return true;
}

const keyValue = {
  use,
  createModel,
};

export default keyValue;
