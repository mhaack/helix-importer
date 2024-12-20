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
export function getBlockName(node) {
  return node.properties.className[0];
}

export function toCamelCase(str) {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => chr.toUpperCase());
}

export function getModelDefinition(blockName, isKeyValue = false) {
  const model = {
    title: blockName,
    id: blockName,
    plugins: {
      xwalk: {
        page: {
          resourceType: 'core/franklin/components/block/v1/block',
          template: {
            name: blockName,
            model: blockName,
          },
        },
      },
    },
  };
  if (isKeyValue) {
    model.plugins.xwalk.page.template['key-value'] = true;
  }
  return model;
}

export function getClassesField(node) {
  // remove the first element from the className array as it is the block name
  const classes = node.properties.className.slice(1);
  if (classes.length === 0) {
    return null;
  }
  const options = [
    {
      name: 'default',
      value: '',
    },
    ...classes.map((c) => ({
      name: c,
      value: c,
    })),
  ];
  return {
    component: 'select',
    name: 'classes',
    label: 'Options',
    valueType: 'string',
    value: '',
    options,
  };
}
