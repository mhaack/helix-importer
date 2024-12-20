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
import fs from 'fs';
import path from 'path';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { md2models } from './importer/md2model/index.js';

export async function generateUeModel() {
// Parse the CLI arguments
  const { argv } = yargs(hideBin(process.argv));
  const inputFilePath = path.resolve(argv.file);
  const outputFilePath = path.resolve('model.json');
  try {
    // Read the markdown content from the input file
    const mdContent = fs.readFileSync(inputFilePath, 'utf-8');

    // Convert the markdown content to models
    const models = await md2models(mdContent, {});

    // Write the models to the output JSON file
    fs.writeFileSync(outputFilePath, JSON.stringify(models, null, 2), 'utf-8');

    console.log(`Models have been written to ${outputFilePath}`);
  } catch (error) {
    console.error('Error converting markdown to models:', error);
  }
}

generateUeModel();

// npm run md2model --file test/importers/md2model/fixtures/container.md
