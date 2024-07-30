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
/* eslint-disable no-use-before-define */

import { select, selectAll } from 'hast-util-select';
import { toString } from 'hast-util-to-string';
import { toHtml } from 'hast-util-to-html';
import button, { getType } from './button.js';
import { encodeHTMLEntities, getHandler, findFieldsById } from '../utils.js';

function nameToClassName(name) {
  return name.toLowerCase()
    .trim()
    .replace(/[^0-9a-z]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function findNameFilterByNameClass(componentDefinition, nameClass) {
  let model = null;
  let filterId = null;
  let name = null;
  let keyValue = null;
  componentDefinition.groups.forEach((group) => {
    group.components.forEach((component) => {
      const templateName = component?.plugins?.xwalk?.page?.template?.name;
      if (templateName && nameToClassName(templateName) === nameClass) {
        filterId = component?.plugins?.xwalk?.page?.template?.filter;
        model = component?.plugins?.xwalk?.page?.template?.model;
        keyValue = component?.plugins?.xwalk?.page?.template['key-value'] || false;
        name = templateName;
      }
    });
  });
  return {
    name, filterId, model, keyValue,
  };
}

function findNameFilterById(componentDefinition, id) {
  let model = null;
  let filterId = null;
  let name = null;
  let keyValue = null;
  componentDefinition.groups.forEach((group) => {
    group.components.forEach((component) => {
      if (component?.id === id) {
        filterId = component?.plugins?.xwalk?.page?.template?.filter;
        model = component?.plugins?.xwalk?.page?.template?.model;
        keyValue = component?.plugins?.xwalk?.page?.template['key-value'] || false;
        name = component?.plugins?.xwalk?.page?.template?.name;
      }
    });
  });
  return {
    name, filterId, model, keyValue,
  };
}

function encodeHtml(str) {
  /* eslint-disable no-param-reassign */
  str = str.replace(/<code>(.*?)<\/code>/gs, (match) => match.replace(/\n/g, '&#xa;'));
  return str.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#xa|#\d+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/(\r\n|\n|\r)/gm, '')
    .replace(/>[\s]*&lt;/g, '>&lt;');
}

function collapseField(id, fields, node, properties = {}) {
  /* eslint-disable no-param-reassign */
  const suffixes = ['Alt', 'Type', 'MimeType', 'Text', 'Title'];
  suffixes.forEach((suffix) => {
    const field = fields.find((f) => f.name === `${id}${suffix}`);
    if (field) {
      if (suffix === 'Type') {
        if (node?.tagName.startsWith('h')) {
          properties[field.name] = node?.tagName?.toLowerCase();
        } else if (button.use(node)) {
          properties[field.name] = getType(node);
        }
      } else if (button.use(node)) {
        if (suffix === 'Text') {
          properties[field.name] = encodeHTMLEntities(select('a', node)?.children?.[0]?.value);
        } else {
          properties[field.name] = encodeHTMLEntities(select('a', node)?.properties?.[suffix.toLowerCase()]);
        }
      } else if (suffix === 'MimeType') {
        // TODO: can we guess the mime type from the src?
        properties[field.name] = 'image/unknown';
      } else {
        properties[field.name] = encodeHTMLEntities(node?.properties?.[suffix.toLowerCase()]);
      }
      // remove falsy names
      if (!properties[field.name]) delete properties[field.name];
      fields.filter((value, index, array) => {
        if (value.name === `${id}${suffix}`) {
          array.splice(index, 1);
          return true;
        }
        return false;
      });
    }
  });
  return properties;
}

function getMainFields(fields) {
  // suffix must be sorted by length descending according to the logic below
  const suffixes = ['MimeType', 'Title', 'Type', 'Text', 'Alt'];
  const itemNames = fields.map((item) => item.name);

  return fields.filter((item) => {
    const itemNameWithoutSuffix = suffixes.reduce((name, suffix) => {
      if (name.endsWith(suffix)) {
        return name.slice(0, -suffix.length);
      }
      return name;
    }, item.name);

    return !(itemNames.includes(itemNameWithoutSuffix) && itemNameWithoutSuffix !== item.name);
  });
}

function createComponentGroups(fields) {
  const components = [];
  fields.forEach((obj) => {
    if (obj.name.includes('_')) {
      const groupName = obj.name.split('_')[0];
      let groupObj = components.find((item) => item.name === groupName);
      if (!groupObj) {
        groupObj = {
          component: 'group',
          name: groupName,
          fields: [],
        };
        components.push(groupObj);
      }
      groupObj.fields.push(obj);
    } else {
      components.push(obj);
    }
  });
  return components;
}

function extractGroupProperties(node, group, elements, properties, ctx) {
  const groupFields = group.fields;
  const groupMainFields = getMainFields(groupFields);
  let field = groupMainFields.shift();

  while (elements.length > 0 && !!field) {
    const element = elements.shift();
    const handler = getHandler(element, [node], ctx);

    if (handler) {
      const isNextRichText = field.component === 'richtext';
      let value;

      if (handler.name === 'button') {
        value = select('a', element)?.properties?.href;
        if (value) value = encodeHTMLEntities(value);
      } else if (handler.name === 'image') {
        value = select('img', element)?.properties?.src;
        if (value) value = encodeHTMLEntities(value);
      } else if (isNextRichText) {
        value = encodeHtml(toHtml(element).trim());
        // <p>&nbsp;</p>
        if (value === '&lt;p>&amp;#x26;nbsp;&lt;/p>' || value === '&lt;p>&lt;/p>') value = '';
      } else {
        value = toString(element).trim();
        if (value === '&amp;#x26;nbsp;' || value === '&nbsp;') value = '';
        value = encodeHTMLEntities(value);
      }

      if (value !== '') {
        if (field.component === 'multiselect' || field.component === 'aem-tag') {
          value = `[${value.split(',').map((v) => v.trim()).join(',')}]`;
        }
        if (properties[field.name]) {
          properties[field.name] += value;
        } else {
          properties[field.name] = value;
        }
        collapseField(field.name, groupFields, element, properties);
      }

      if (!isNextRichText || value === '') {
        field = groupMainFields.shift();
      }
    }
  }
}

function extractProperties(node, id, ctx, mode) {
  const children = node.children.filter((child) => child.type === 'element');
  const properties = {};
  const { componentModels } = ctx;
  const fields = createComponentGroups(findFieldsById(componentModels, id));
  const mainFields = getMainFields(fields);
  mainFields.forEach((field, idx) => {
    if (children.length <= idx) return;
    if (field.component === 'group') {
      const selector = mode === 'blockItem' ? ':scope' : 'div > div';
      const containerNode = select(selector, children[idx]);
      const containerChildren = containerNode.children.filter((child) => child.type === 'element');
      extractGroupProperties(node, field, containerChildren, properties, ctx);
    } else if (field.name === 'classes' && mode !== 'blockItem') {
      // handle the classes as className only for blocks, not block items
      const classNames = node?.properties?.className;
      if (classNames?.length > 1) {
        let value = classNames.slice(1).map((v) => v.trim()).join(',');
        if (field.component === 'multiselect' || field.component === 'aem-tag') {
          value = `[${value}]`;
        }
        properties[field.name] = value;
      }
    } else if (field?.component === 'richtext') {
      const selector = mode === 'blockItem' ? ':scope > *' : ':scope > div > * ';
      let selection = selectAll(selector, children[idx]);
      if (selection.length === 0) {
        // if there is just a single paragraph, it is just text, not in a <p>
        const parentSelector = mode === 'blockItem' ? ':scope' : ':scope > div';
        const containers = selectAll(parentSelector, children[idx]);
        if (containers[0]?.children[0]?.type === 'text') {
          selection = [{
            type: 'element',
            tagName: 'p',
            properties: {},
            children: containers[0].children,
          }];
        }
      }
      properties[field.name] = encodeHtml(toHtml(selection).trim());
      if (properties[field.name] === '&lt;p>&amp;#x26;nbsp;&lt;/p>' || properties[field.name] === '&lt;p>&lt;/p>') properties[field.name] = '';
    } else {
      const imageNode = select('img', children[idx]);
      const linkNode = select('a', children[idx]);
      const headlineNode = select('h1, h2, h3, h4, h5, h6', children[idx]);
      if (imageNode) {
        properties[field.name] = encodeHTMLEntities(imageNode.properties?.src);
        collapseField(field.name, fields, imageNode, properties);
      } else if (linkNode) {
        properties[field.name] = encodeHTMLEntities(linkNode.properties?.href);
        collapseField(field.name, fields, select('p', children[idx]), properties);
      } else if (headlineNode) {
        const text = toString(select(headlineNode.tagName, children[idx])).trim();
        properties[field.name] = encodeHTMLEntities(text);
        collapseField(field.name, fields, headlineNode, properties);
      } else {
        const selector = mode === 'keyValue' ? 'div > div:nth-last-child(1)' : 'div';
        let value = encodeHTMLEntities(toString(select(selector, children[idx])).trim());
        if (value === '&amp;#x26;nbsp;' || value === '&nbsp;') value = '';
        if (field.component === 'multiselect' || field.component === 'aem-tag') {
          value = `[${value.split(',').map((v) => v.trim()).join(',')}]`;
        }
        if (value) properties[field.name] = value;
      }
    }
  });
  if (id) properties.model = id;
  return properties;
}

function getBlockItems(node, allowedComponents, ctx) {
  if (!allowedComponents.length) {
    return undefined;
  }
  const { pathMap, path, componentDefinition } = ctx;
  const rows = node.children.filter((child) => child.type === 'element' && child.tagName === 'div');
  return rows.map((row, i) => {
    const itemPath = `${path}/item${i + 1}`;
    pathMap.set(rows[i], itemPath);
    const parsedComponents = allowedComponents.map((childComponentId) => {
      const { name, model } = findNameFilterById(componentDefinition, childComponentId);
      const properties = extractProperties(rows[i], model, ctx, 'blockItem');
      return {
        type: 'element',
        name: i > 0 ? `item_${i - 1}` : 'item',
        attributes: {
          'jcr:primaryType': 'nt:unstructured',
          'sling:resourceType': 'core/franklin/components/block/v1/block/item',
          name,
          ...properties,
        },
      };
    });
    return parsedComponents.sort((a, b) => {
      const leftAttributesLen = Object.entries(a.attributes).length;
      const rightAttributesLen = Object.entries(b.attributes).length;
      return rightAttributesLen - leftAttributesLen;
    })[0];
  });
}

function generateProperties(node, ctx) {
  /* eslint-disable no-console */
  const nameClass = node?.properties?.className[0] || undefined;
  if (!nameClass) {
    console.warn('Block component not found');
    return {};
  }
  const { componentModels, componentDefinition, filters } = ctx;
  if (!componentModels || !componentDefinition || !filters) {
    console.warn('Block component not found');
    return {};
  }
  const {
    name, model, filterId, keyValue,
  } = findNameFilterByNameClass(componentDefinition, nameClass);
  const allowedComponents = filters.find((item) => item.id === filterId)?.components || [];
  const attributes = extractProperties(node, model, ctx, keyValue ? 'keyValue' : 'simple');
  const blockItems = getBlockItems(node, allowedComponents, ctx);
  const properties = {
    name,
    filter: filterId,
    ...attributes,
  };

  return { properties, children: blockItems };
}

function getAttributes(node, ctx) {
  const { properties, children } = generateProperties(node, ctx);
  return {
    rt: 'core/franklin/components/block/v1/block',
    children,
    ...properties,
  };
}

function use(node, parents) {
  return node?.tagName === 'div'
    && parents.length > 2
    && parents[parents.length - 2].tagName === 'main'
    && node.properties?.className?.length > 0
    && node.properties?.className[0] !== 'columns'
    && node.properties?.className[0] !== 'metadata'
    && node.properties?.className[0] !== 'section-metadata';
}

const block = {
  use,
  getAttributes,
  leaf: true,
};

export default block;
