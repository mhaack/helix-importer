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
import { raw } from 'hast-util-raw';
import { unified } from 'unified';
import { toHast as mdast2hast, defaultHandlers } from 'mdast-util-to-hast';
import remarkGridTable from '@adobe/remark-gridtables';
import { mdast2hastGridTablesHandler, TYPE_TABLE } from '@adobe/mdast-util-gridtables';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import rehypeFormat from 'rehype-format';
import createPageBlocks from '@adobe/helix-html-pipeline/src/steps/create-page-blocks.js';
import { h } from 'hastscript';
import fixSections from '@adobe/helix-html-pipeline/src/steps/fix-sections.js';
import { visitParents } from 'unist-util-visit-parents';
import createHead from '../html2jcr/hast2jcr/hast-head.js';
import handlers from './handlers/index.js';

function getHandler(node) {
  // Find the handler that can handle the node
  return Object.values(handlers).find((handler) => handler.use(node));
}

function createModel(node) {
  const handler = getHandler(node);
  if (handler) {
    return handler.createModel(node);
  }
  return null;
}

function isBlock(node, parents) {
  return node?.tagName === 'div'
    && parents.length > 2
    && parents[parents.length - 2].tagName === 'main'
    && node.properties?.className?.length > 0
    && node.properties?.className[0] !== 'columns'
    && node.properties?.className[0] !== 'metadata'
    && node.properties?.className[0] !== 'section-metadata';
}

function hast2models(hast) {
  const models = {
    filters: [],
    definition: {
      groups: [
        {
          title: 'Blocks',
          id: 'blocks',
          components: [],
        },
      ],
    },
    models: [],
  };
  visitParents(hast, 'element', (node, parents) => {
    if (isBlock(node, parents)) {
      const model = createModel(node);
      if (model) {
        models.models.push(...model.models);
        models.definition.groups[0].components.push(...model.definition.groups[0].components);
        models.filters.push(...model.filters);
      }
    }
    return 'continue';
  });
  return models;
}

export async function md2models(md, opts) {
  const mdast = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkGridTable)
    .parse(md);

  const main = mdast2hast(mdast, {
    handlers: {
      ...defaultHandlers,
      [TYPE_TABLE]: mdast2hastGridTablesHandler(),
    },
    allowDangerousHtml: true,
  });

  const content = { hast: main };

  fixSections({ content });
  createPageBlocks({ content });
  const $head = createHead({ content });

  const doc = h('html', [
    $head,
    h('body', [
      h('header', []),
      h('main', content.hast),
      h('footer', [])]),
  ]);

  raw(doc);
  rehypeFormat()(doc);
  return hast2models(doc, opts);
}
