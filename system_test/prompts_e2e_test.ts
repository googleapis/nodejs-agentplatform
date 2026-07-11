/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Client} from '../src/client';

const PROJECT = process.env['GCLOUD_PROJECT'] || process.env['GOOGLE_CLOUD_PROJECT'];
const LOCATION = process.env['GCLOUD_LOCATION'] || 'us-central1';
const MODEL = 'gemini-2.0-flash';

describe('Prompts E2E System Tests', () => {
  let client: Client;
  let createdPromptId: string | undefined;
  let versionIdV1: string | undefined;
  let versionIdV2: string | undefined;

  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;
    if (!PROJECT) {
      throw new Error(
        'GCLOUD_PROJECT environment variable must be set to run E2E system tests.'
      );
    }
    client = new Client({
      project: PROJECT,
      location: LOCATION,
    });
  }, 600000);

  afterAll(async () => {
    if (createdPromptId) {
      try {
        await client.prompts.delete({promptId: createdPromptId});
      } catch (err) {
        console.error(`Failed to cleanup prompt ${createdPromptId}:`, err);
      }
    }
  }, 600000);

  it('runs strict end-to-end lifecycle for Prompts API', async () => {
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
        promptDisplayName: `e2e_test_prompt_${Date.now()}`,
        versionDisplayName: 'v1',
      },
    });

    expect(promptV1).toBeDefined();
    expect(promptV1.promptData).toBeDefined();

    const datasetResource = (promptV1 as any)._dataset;
    const versionResource = (promptV1 as any)._dataset_version;
    expect(datasetResource?.name).toBeDefined();
    expect(versionResource?.name).toBeDefined();

    createdPromptId = datasetResource.name.split('/').pop();
    versionIdV1 = versionResource.name.split('/').pop();

    expect(createdPromptId).toBeDefined();
    expect(versionIdV1).toBeDefined();

    const fetchedPrompt = await client.prompts.get({
      promptId: createdPromptId!,
    });
    expect(fetchedPrompt.promptData).toBeDefined();

    const fetchedVersion = await client.prompts.getVersion({
      promptId: createdPromptId!,
      versionId: versionIdV1!,
    });
    expect(fetchedVersion.promptData).toBeDefined();

    const promptRefs = await client.prompts.list();
    expect(promptRefs.length).toBeGreaterThan(0);
    const foundRef = promptRefs.find((r) => r.promptId === createdPromptId);
    expect(foundRef).toBeDefined();

    const promptV2 = await client.prompts.update({
      promptId: createdPromptId!,
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

    expect(promptV2.promptData).toBeDefined();
    const versionResourceV2 = (promptV2 as any)._dataset_version;
    versionIdV2 = versionResourceV2?.name.split('/').pop();
    expect(versionIdV2).toBeDefined();
    expect(versionIdV2).not.toEqual(versionIdV1);

    const versionRefs = await client.prompts.listVersions({
      promptId: createdPromptId!,
    });
    expect(versionRefs.length).toBeGreaterThanOrEqual(2);
    expect(versionRefs.some((v) => v.versionId === versionIdV1)).toBeTrue();
    expect(versionRefs.some((v) => v.versionId === versionIdV2)).toBeTrue();

    const restoredPrompt = await client.prompts.restoreVersion({
      promptId: createdPromptId!,
      versionId: versionIdV1!,
    });
    expect(restoredPrompt.promptData).toBeDefined();
    expect((restoredPrompt as any)._dataset_version).toBeDefined();

    await client.prompts.deleteVersion({
      promptId: createdPromptId!,
      versionId: versionIdV2!,
    });

    const afterDeleteVersionRefs = await client.prompts.listVersions({
      promptId: createdPromptId!,
    });
    expect(afterDeleteVersionRefs.some((v) => v.versionId === versionIdV2)).toBeFalse();

    await client.prompts.delete({
      promptId: createdPromptId!,
    });
    createdPromptId = undefined;
  }, 600000);
});
