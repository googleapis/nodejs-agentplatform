/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import 'jasmine';
import {ReplayClient} from './_replay_client.js';
import * as types from '../../src/types.js';

describe('SkillRevisions', () => {
  let client: ReplayClient;
  beforeEach(() => {
    client = new ReplayClient({
      project: 'test-project',
      location: 'us-central1',
    });
  });

  it('gets a skill revision', async () => {
    const fetchSpy = client.setupReplay(
        'skills_revisions_get/test_get_skill_revision.vertex.json');

    // 1. Create skill (triggers LRO)
    await client.skills.create({
      skillId: 'my-skill-to-get-revision',
      displayName: 'Replay Revision Test Skill',
      description: 'A temporary skill to test revisions E2E',
      config: {
        zippedFilesystem: 'UEsDBBQAAAAIAAAAIQCe39waLQAAADIAAAAIAAAAU0tJTEwubWRTVghKLchJrARSZZnFmfl5CiGpxSUKwdmZOTlcIRmZxQpAlKhQAhIsBgnqAQBQSwECFAMUAAAACAAAACEAnt/cGi0AAAAyAAAACAAAAAAAAAAAAAAApAEAAAAAU0tJTEwubWRQSwUGAAAAAAEAAQA2AAAAUwAAAAAA',
      }
    });

    // 3. List Revisions
    const listResponse = await client.skills.revisions.list({
      name: 'projects/682537715590/locations/us-central1/skills/my-skill-to-get-revision',
    });
    expect(listResponse.skillRevisions).toBeDefined();
    expect(listResponse.skillRevisions!.length).toBeGreaterThan(0);

    // 4. Get Revision
    const revision = await client.skills.revisions.get({
      name: 'projects/682537715590/locations/us-central1/skills/my-skill-to-get-revision/revisions/4500503402626678784',
    });
    expect(revision.name).toBe('projects/682537715590/locations/us-central1/skills/my-skill-to-get-revision/revisions/4500503402626678784');
    expect(revision.state).toBe(types.SkillRevisionState.ACTIVE);

    // 5. Delete Skill (triggers LRO)
    await client.skills.delete({
      name: 'projects/682537715590/locations/us-central1/skills/my-skill-to-get-revision',
    });

    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    client.verifyAllInteractions();
  });

  it('lists skill revisions', async () => {
    const fetchSpy = client.setupReplay(
        'skills_revisions_list/test_list_skill_revisions.vertex.json');

    // 1. Create skill (triggers LRO)
    await client.skills.create({
      skillId: 'my-skill-to-list-revisions',
      displayName: 'Replay List Revisions Test Skill',
      description: 'A temporary skill to test list revisions E2E',
      config: {
        zippedFilesystem: 'UEsDBBQAAAAIAAAAIQDUraUeMQAAADgAAAAIAAAAU0tJTEwubWRTVghKLchJrFTwySwuAbLLMosz8/OKFUJSgdzg7MycHK6QjMxiBSBKVCgBCRaDBPUAUEsBAhQDFAAAAAgAAAAhANStpR4xAAAAOAAAAAgAAAAAAAAAAAAAAKQBAAAAAFNLSUxMLm1kUEsFBgAAAAABAAEANgAAAFcAAAAAAA==',
      }
    });

    // 3. List Revisions
    const listResponse = await client.skills.revisions.list({
      name: 'projects/682537715590/locations/us-central1/skills/my-skill-to-list-revisions',
    });
    expect(listResponse.skillRevisions).toBeDefined();
    expect(listResponse.skillRevisions!.length).toBeGreaterThan(0);

    // 4. Delete Skill (triggers LRO)
    await client.skills.delete({
      name: 'projects/682537715590/locations/us-central1/skills/my-skill-to-list-revisions',
    });

    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    client.verifyAllInteractions();
  });
});
