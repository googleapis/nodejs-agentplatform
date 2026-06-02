/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client } from '../../src/client.js';
import * as types from '../../src/types.js';

const PROJECT = process.env['GCLOUD_PROJECT'] || 'your-gcp-project-id';
const LOCATION = 'us-central1';
const SKILL_ID = `test-js-sdk-skill-${Date.now()}`;

async function runE2ETest() {
  if (PROJECT === 'your-gcp-project-id') {
    console.error('Please set GCLOUD_PROJECT env var or update the script with your project ID.');
    process.exit(1);
  }

  const client = new Client({ project: PROJECT, location: LOCATION });

  console.log(`Starting E2E test with Skill ID: ${SKILL_ID}`);

  // =========================================================================
  // 1. Create Skill
  // =========================================================================
  console.log('\n--- 1. Creating Skill ---');
  const sampleZipBase64 = 'UEsDBBQAAAAIAKmuv1zKjtBiQAAAAFYAAAAIABwAU0tJTEwubWRVVAkAA82tHGq7rRxqdXgLAAEEkBwSAARTXwEA09XV5cpLzE21UihJLS7RLc7OzMnhSkktTi7KLCjJzM+zUnAEyyhAZHSBypUVQkACwWCBkIzMYgUgSkRSpccFAFBLAQIeAxQAAAAIAKmuv1zKjtBiQAAAAFYAAAAIABgAAAAAAAEAAACkgQAAAABTS0lMTC5tZFVUBQADza0canV4CwABBJAcEgAEU18BAFBLBQYAAAAAAQABAE4AAACCAAAAAAA=';

  const createResponse = (await client.skills.create({
    skillId: SKILL_ID,
    displayName: 'JS SDK E2E Test Skill',
    description: 'A skill created by the JS SDK E2E test script',
    config: {
      zippedFilesystem: sampleZipBase64,
      waitForCompletion: true,
    }
  })) as types.Skill;
  const skillName = createResponse.name!;
  console.log('Skill created successfully:', skillName);

  // =========================================================================
  // 2. Get Skill
  // =========================================================================
  console.log('\n--- 2. Getting Skill ---');
  const getResponse = await client.skills.get({ name: skillName });
  console.log('Got Skill Details:');
  console.log(`  Display Name: ${getResponse.displayName}`);
  console.log(`  Description:  ${getResponse.description}`);

  // =========================================================================
  // 3. List Skills
  // =========================================================================
  console.log('\n--- 3. Listing Skills ---');
  const listResponse = await client.skills.list();
  console.log(`Found ${listResponse.page.length} skills in the current page.`);
  const found = listResponse.page.some(s => s.name === skillName);
  console.log(`Created skill found in list: ${found}`);

  // =========================================================================
  // 4. Update Skill
  // =========================================================================
  console.log('\n--- 4. Updating Skill ---');
  const updateResponse = (await client.skills.update({
    name: skillName,
    config: {
      displayName: 'JS SDK E2E Test Skill (Updated)',
      description: 'An updated description for the E2E test skill',
      waitForCompletion: true,
    }
  })) as types.Skill;
  console.log('Skill updated successfully.');
  console.log(`  New Display Name: ${updateResponse.displayName}`);
  console.log(`  New Description:  ${updateResponse.description}`);

  // =========================================================================
  // 5. List Revisions
  // =========================================================================
  console.log('\n--- 5. Listing Skill Revisions ---');
  const revisionsList = await client.skills.revisions.list({ name: skillName });
  console.log(`Found ${revisionsList.skillRevisions?.length || 0} revisions.`);

  if (revisionsList.skillRevisions && revisionsList.skillRevisions.length > 0) {
    const latestRevisionName = revisionsList.skillRevisions[0].name!;
    console.log('Latest Revision Name:', latestRevisionName);

    // =========================================================================
    // 6. Get Revision
    // =========================================================================
    console.log('\n--- 6. Getting Skill Revision ---');
    const revision = await client.skills.revisions.get({ name: latestRevisionName });
    console.log(`Revision Name:  ${revision.name}`);
    console.log(`Revision State: ${revision.state}`);
  } else {
    console.log('No revisions found to query.');
  }

  // =========================================================================
  // 7. Delete Skill
  // =========================================================================
  console.log('\n--- 7. Deleting Skill ---');
  await client.skills.delete({
    name: skillName,
    config: {
      waitForCompletion: true,
    }
  });
  console.log('Skill deleted successfully:', skillName);

  // =========================================================================
  // 8. Verify Deletion
  // =========================================================================
  console.log('\n--- 8. Verifying Deletion ---');
  try {
    await client.skills.get({ name: skillName });
    console.error('ERROR: Skill still exists after deletion!');
  } catch (error) {
    console.log('Success: Verification failed as expected (Skill not found).');
  }
}

runE2ETest().catch(console.error);
