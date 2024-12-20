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
} from './utils.js';
import { getChildElements } from '../utils.js';
import { getCellHandler } from '../cellHandlers/index.js';

function getNumberOfRowsWithOneCell(rows) {
  let count = 0;
  for (let i = 0; i < rows.length; i += 1) {
    const cells = getChildElements(rows[i]);
    if (cells.length === 1) {
      count += 1;
    } else {
      break;
    }
  }
  return count;
}

function createModel(node) {
  const blockName = getBlockName(node);
  const rows = getChildElements(node);
  const numberOfRowsWithOneCell = getNumberOfRowsWithOneCell(rows);
  const parentFields = [];
  // iterate over the parent property rows and create the parent fields
  for (let i = 0; i < numberOfRowsWithOneCell; i += 1) {
    const cell = getChildElements(rows[i])[0];
    const cellHandler = getCellHandler(cell);
    if (cellHandler) {
      parentFields.push(...cellHandler.fields(i, '', cell));
    } else {
      throw new Error(`Unsupported cell type: ${cell.tagName}`);
    }
  }
  const classesField = getClassesField(node);
  if (classesField) {
    // insert the classes field at the beginning of the fields array
    parentFields.unshift(classesField);
  }
  const firstItemCells = getChildElements(rows[numberOfRowsWithOneCell]);
  const itemFields = firstItemCells.flatMap((cell, idx) => {
    const cellHandler = getCellHandler(cell);
    if (cellHandler) {
      return cellHandler.fields(idx, '', cell);
    }
    throw new Error(`Unsupported cell type: ${cell.tagName}`);
  });
  const model = {
    filters: [
      {
        id: blockName,
        components: [
          `${blockName}-item`,
        ],
      },
    ],
    definition: {
      groups: [
        {
          title: 'Blocks',
          id: 'blocks',
          components: [
            getModelDefinition(blockName),
            {
              title: `${blockName}-item`,
              id: `${blockName}-item`,
              plugins: {
                xwalk: {
                  page: {
                    resourceType: 'core/franklin/components/block/v1/block/item',
                    template: {
                      name: `${blockName}-item`,
                      model: `${blockName}-item`,
                    },
                  },
                },
              },
            },
          ],
        },
      ],
    },
    models: [
      {
        id: `${blockName}-item`,
        fields: itemFields,
      },
    ],
  };
  if (parentFields.length > 0) {
    model.models.push({
      id: blockName,
      fields: parentFields,
    });
  }
  return model;
}

function use(node) {
  // has 1 to n rows
  const rows = getChildElements(node);
  if (rows.length === 0) {
    return false;
  }
  const numberOfRowsWithOneCell = getNumberOfRowsWithOneCell(rows);
  // all rows have more than 2 cells and all the rows have the same amount of cells
  const cellCount = getChildElements(rows[numberOfRowsWithOneCell]).length;
  if (cellCount <= 2) {
    return false;
  }
  for (let i = numberOfRowsWithOneCell; i < rows.length; i += 1) {
    const cells = getChildElements(rows[i]);
    if (cells.length !== cellCount) {
      return false;
    }
  }
  return true;
}

const container = {
  use,
  createModel,
};

export default container;
