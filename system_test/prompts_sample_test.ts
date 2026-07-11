/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Standalone executable sample for Prompts API
// Run with: npx ts-node third_party/javascript/node_modules/vertexai/system_test/prompts_sample_test.ts
import {Client} from '../src/client';
import * as assert from 'assert';

const PROJECT = process.env['GCLOUD_PROJECT'] || process.env['GOOGLE_CLOUD_PROJECT'];
const LOCATION = process.env['GCLOUD_LOCATION'] || 'us-central1';
const MODEL = 'gemini-2.0-flash';

async function runPromptsSample() {
  if (!PROJECT) {
    console.error('ERROR: GCLOUD_PROJECT environment variable must be set.');
    process.exit(1);
  }

  const client = new Client({
    project: PROJECT,
    location: LOCATION,
  });

  let promptId: string | undefined;
  let versionIdV1: string | undefined;
  let versionIdV2: string | undefined;

  try {
    const promptV1 = await client.prompts.createVersion({
      prompt: {
        promptData: {
          contents: [
            {
              role: 'user',
              parts: [{text: 'You are a helpful GenAI assistant v1.'}],
            },
          ],
          model: MODEL,
        },
      },
      config: {
        promptDisplayName: `standalone_sample_prompt_${Date.now()}`,
        versionDisplayName: 'v1',
      },
    });

    const datasetResource = (promptV1 as any)._dataset;
    const versionResource = (promptV1 as any)._dataset_version;
    promptId = datasetResource?.name?.split('/').pop();
    versionIdV1 = versionResource?.name?.split('/').pop();

    assert.ok(promptId, 'Prompt ID should be present');
    assert.ok(versionIdV1, 'Version ID should be present');

    const fetchedPrompt = await client.prompts.get({
      promptId: promptId!,
    });
    assert.ok(fetchedPrompt.promptData, 'Fetched prompt should have promptData');

    const fetchedVersion = await client.prompts.getVersion({
      promptId: promptId!,
      versionId: versionIdV1!,
    });
    assert.ok(fetchedVersion.promptData, 'Fetched version should have promptData');

    const promptRefs = await client.prompts.list();
    const foundRef = promptRefs.find((r) => r.promptId === promptId);
    assert.ok(foundRef, 'Created prompt ID should be found in listed prompts');

    const promptV2 = await client.prompts.update({
      promptId: promptId!,
      prompt: {
        promptData: {
          contents: [
            {
              role: 'user',
              parts: [{text: 'You are an updated GenAI assistant v2.'}],
            },
          ],
          model: MODEL,
        },
      },
      config: {
        versionDisplayName: 'v2',
      },
    });
    const versionResourceV2 = (promptV2 as any)._dataset_version;
    versionIdV2 = versionResourceV2?.name?.split('/').pop();
    assert.ok(versionIdV2, 'Version ID 2 should be present');
    assert.notStrictEqual(versionIdV1, versionIdV2, 'New version ID should differ from v1');

    const versionRefs = await client.prompts.listVersions({
      promptId: promptId!,
    });
    assert.ok(versionRefs.some((v) => v.versionId === versionIdV1), 'v1 should be present');
    assert.ok(versionRefs.some((v) => v.versionId === versionIdV2), 'v2 should be present');

    const restoredPrompt = await client.prompts.restoreVersion({
      promptId: promptId!,
      versionId: versionIdV1!,
    });
    assert.ok(restoredPrompt.promptData, 'Restored prompt should have promptData');

    await client.prompts.deleteVersion({
      promptId: promptId!,
      versionId: versionIdV2!,
    });
    const afterDeleteVersionRefs = await client.prompts.listVersions({
      promptId: promptId!,
    });
    assert.ok(
      !afterDeleteVersionRefs.some((v) => v.versionId === versionIdV2),
      'v2 should no longer be listed'
    );

    await client.prompts.delete({
      promptId: promptId!,
    });
    promptId = undefined;
  } catch (err) {
    console.error('\n❌ Error during Prompts E2E execution:', err);
    process.exit(1);
  } finally {
    if (promptId) {
      try {
        await client.prompts.delete({promptId});
      } catch (e) {
        console.error(`[Cleanup] Failed to delete prompt ${promptId}:`, e);
      }
    }
  }
}

runPromptsSample();
