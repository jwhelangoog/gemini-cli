/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, beforeEach, afterEach } from 'vitest';
import { TestRig } from './test-helper.js';

describe('Scroll History', () => {
  let rig: TestRig;

  beforeEach(() => {
    rig = new TestRig();
  });

  afterEach(async () => {
    await rig.cleanup();
  });

  it('CONTROL+PAGE_UP and CONTROL+PAGE_DOWN should scroll the history pane', async () => {
    rig.setup('scroll-history');

    const run = await rig.runInteractive();

    // 1. Generate enough history to fill the screen and enable scrolling.
    // Use shell commands (!echo) to avoid network calls and response waiting.
    // This fills the history with "echo Message X" and the output "Message X".
    const messageCount = 100;
    for (let i = 0; i < messageCount; i++) {
      // Send shell command
      await run.sendKeys(`!echo "Message ${i}"`);
      await run.sendKeys('\r');

      // Wait for the command output to appear.
      // This confirms the command ran and is now in the history/output buffer.
      await run.expectText(`Message ${i}`, 5000);
    }

    // 2. Scroll Up
    // We are at the bottom. "Message 0" should be virtualized out.
    // Send Ctrl+PageUp (\x1b[5;5~) repeatedly to scroll to the top.
    for (let i = 0; i < 20; i++) {
      await run.ptyProcess.write('\x1b[5;5~');
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // 3. Verify Scroll Up
    // Clear the accumulated output buffer. This ensures 'Message 0' is found
    // only if the app re-renders it (scrolls it into view).
    run.output = '';

    // We check if "Message 0" is present in the output *after* we finished the loop.
    await run.expectText('Message 0');

    // 4. Scroll Down
    // Clear buffer again to track movement back down.
    run.output = '';

    // Send Ctrl+PageDown (\x1b[6;5~) to go back to the bottom.
    for (let i = 0; i < 20; i++) {
      await run.ptyProcess.write('\x1b[6;5~');
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // 5. Verify Scroll Down / Live
    // Send a new message to confirm we are back at the bottom and the app is interactive.
    await run.sendKeys('!echo "Final check"');
    await run.sendKeys('\r');
    await run.expectText('Final check');
  });
});
