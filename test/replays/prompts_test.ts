/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import 'jasmine';
import {ReplayClient} from './_replay_client.js';

describe('Prompts', () => {
  let client: ReplayClient;

  beforeEach(() => {
    client = new ReplayClient({
      project: 'test-project',
      location: 'us-central1',
    });
  });

  it('gets a prompt resource', async () => {
    const fetchSpy = client.setupReplay(
      'get_prompt_resource/test_get_prompt.vertex.json'
    );
    const prompt = await client.prompts.get({
      promptId: '6550997480673116160',
    });
    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(prompt).toBeDefined();
    expect(prompt.promptData).toBeDefined();
    client.verifyAllInteractions();
  });

  it('gets a prompt version resource', async () => {
    const fetchSpy = client.setupReplay(
      'get_prompt_resource/test_get_prompt_version.vertex.json'
    );
    const prompt = await client.prompts.getVersion({
      promptId: '6550997480673116160',
      versionId: '2',
    });
    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    client.verifyInteraction(1, fetchSpy.calls.argsFor(1));
    expect(prompt).toBeDefined();
    expect(prompt.promptData).toBeDefined();
    client.verifyAllInteractions();
  });

  it('lists prompt resources', async () => {
    const fetchSpy = client.setupReplay(
      'list_prompts/test_list_returns_prompts.vertex.json'
    );
    const prompts1 = await client.prompts.list();
    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(prompts1).toBeDefined();
    expect(prompts1.length).toBeGreaterThan(0);

    const prompts2 = await client.prompts.list();
    expect(prompts2).toBeDefined();
    expect(prompts2.length).toBeGreaterThan(0);

    const prompts3 = await client.prompts.list();
    expect(prompts3).toBeDefined();
    client.verifyAllInteractions();
  });
});
