/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Box } from 'ink';
import { Notifications } from '../components/Notifications.js';
import { MainContent } from '../components/MainContent.js';
import { DialogManager } from '../components/DialogManager.js';
import { Composer } from '../components/Composer.js';
import { ExitWarning } from '../components/ExitWarning.js';
import { useUIState } from '../contexts/UIStateContext.js';
import { useFlickerDetector } from '../hooks/useFlickerDetector.js';
import { useAlternateBuffer } from '../hooks/useAlternateBuffer.js';
import { CopyModeWarning } from '../components/CopyModeWarning.js';
import { useRef } from 'react';
import { useKeypress, type Key } from '../hooks/useKeypress.js';
import { keyMatchers, Command } from '../keyMatchers.js';
import { type ScrollableListRef } from '../components/shared/ScrollableList.js';

export const DefaultAppLayout: React.FC = () => {
  const uiState = useUIState();
  const isAlternateBuffer = useAlternateBuffer();
  const scrollableListRef = useRef<ScrollableListRef<unknown>>(null);

  const { rootUiRef, terminalHeight } = uiState;
  useFlickerDetector(rootUiRef, terminalHeight);

  useKeypress(
    (key: Key) => {
      if (
        keyMatchers[Command.PAGE_UP_CTRL](key) ||
        keyMatchers[Command.PAGE_DOWN_CTRL](key)
      ) {
        const direction = keyMatchers[Command.PAGE_UP_CTRL](key) ? -1 : 1;
        const scrollState = scrollableListRef.current?.getScrollState();
        if (scrollState) {
          const { innerHeight } = scrollState;
          scrollableListRef.current?.scrollBy(direction * innerHeight);
        }
      }
    },
    {
      isActive:
        !uiState.dialogsVisible &&
        !uiState.customDialog &&
        !uiState.embeddedShellFocused,
    },
  );

  // If in alternate buffer mode, need to leave room to draw the scrollbar on
  // the right side of the terminal.
  const width = isAlternateBuffer
    ? uiState.terminalWidth
    : uiState.mainAreaWidth;
  return (
    <Box
      flexDirection="column"
      width={width}
      height={terminalHeight > 0 ? terminalHeight - 1 : undefined}
      flexShrink={0}
      flexGrow={0}
      overflow="hidden"
      ref={uiState.rootUiRef}
    >
      <Box flexGrow={1} overflow="hidden">
        <MainContent ref={scrollableListRef} />
      </Box>

      <Box
        flexDirection="column"
        ref={uiState.mainControlsRef}
        flexShrink={0}
        flexGrow={0}
      >
        <Notifications />
        <CopyModeWarning />

        {uiState.customDialog ? (
          uiState.customDialog
        ) : uiState.dialogsVisible ? (
          <DialogManager
            terminalWidth={uiState.mainAreaWidth}
            addItem={uiState.historyManager.addItem}
          />
        ) : (
          <Composer />
        )}

        <ExitWarning />
      </Box>
    </Box>
  );
};
