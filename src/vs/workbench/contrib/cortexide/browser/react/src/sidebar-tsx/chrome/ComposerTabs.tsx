/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { LoaderCircle, Plus, X, History, Settings2 } from 'lucide-react';
import { useAccessor, useChatThreadsState, useFullChatThreadsStreamState } from '../../util/services.js';
import type { IsRunningType } from '../../../chatThreadService.js';
import { getThreadTabLabel } from '../../../../common/threadTitle.js';
import { CORTEXIDE_OPEN_SETTINGS_ACTION_ID } from '../../../cortexideSettingsPane.js';

const MAX_VISIBLE_TABS = 12;

type ComposerTabsProps = {
	showHistory?: boolean;
	onToggleHistory?: () => void;
};

export const ComposerTabs = ({ showHistory, onToggleHistory }: ComposerTabsProps = {}) => {
	const accessor = useAccessor();
	const commandService = accessor.get('ICommandService');
	const chatThreadsService = accessor.get('IChatThreadService');
	const { openTabs, currentThreadId, allThreads } = useChatThreadsState();
	const streamState = useFullChatThreadsStreamState();

	const tabs = openTabs.slice(0, MAX_VISIBLE_TABS);

	const isRunning = (threadId: string): IsRunningType | undefined =>
		streamState[threadId]?.isRunning;

	return (
		<div
			className="flex items-center gap-1 px-2 py-1 border-b border-void-border-3/70 bg-void-bg-2/80 shrink-0 min-h-[36px]"
			role="tablist"
			aria-label="Chat threads"
		>
			<div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto void-scrollbar">
				{tabs.map(threadId => {
					const thread = allThreads[threadId];
					const active = threadId === currentThreadId;
					const label = getThreadTabLabel(thread);
					const running = isRunning(threadId);

					return (
						<div
							key={threadId}
							role="tab"
							aria-selected={active}
							className={`
								group flex items-center gap-1 max-w-[140px] shrink-0 pl-2.5 pr-1 py-1 rounded-md text-xs cursor-pointer
								border transition-colors duration-100
								${active
									? 'bg-void-bg-1 border-void-border-2 text-void-fg-1 shadow-sm font-medium'
									: 'bg-transparent border-transparent text-void-fg-3 hover:text-void-fg-2 hover:bg-void-bg-1/50'}
							`}
							onClick={() => chatThreadsService.switchToTab(threadId)}
							title={label}
						>
							{(running === 'LLM' || running === 'tool' || running === 'preparing') && (
								<LoaderCircle className="size-3 shrink-0 animate-spin text-[var(--cortex-brand,#3b82f6)]" aria-hidden />
							)}
							<span className="truncate">{label}</span>
							{tabs.length > 1 && (
								<button
									type="button"
									className="shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-void-bg-3 text-void-fg-3 hover:text-void-fg-1 void-focus-ring"
									aria-label={`Close ${label}`}
									onClick={(e) => {
										e.stopPropagation();
										chatThreadsService.closeTab(threadId);
									}}
								>
									<X className="size-3" />
								</button>
							)}
						</div>
					);
				})}
			</div>

			<div className="flex items-center gap-0.5 shrink-0 ml-1">
				<button
					type="button"
					className="shrink-0 p-1.5 rounded-md text-void-fg-3 hover:text-void-fg-1 hover:bg-void-bg-1 void-focus-ring"
					aria-label="New chat"
					title="New chat"
					onClick={() => chatThreadsService.openNewThread()}
				>
					<Plus className="size-3.5" />
				</button>
				{onToggleHistory && (
					<button
						type="button"
						className={`shrink-0 p-1.5 rounded-md void-focus-ring ${showHistory ? 'bg-void-bg-1 text-void-fg-1' : 'text-void-fg-3 hover:text-void-fg-1 hover:bg-void-bg-1'}`}
						aria-label="Toggle chat history"
						aria-pressed={showHistory}
						title="Chat history"
						onClick={onToggleHistory}
					>
						<History className="size-3.5" />
					</button>
				)}
				<button
					type="button"
					className="shrink-0 p-1.5 rounded-md text-void-fg-3 hover:text-void-fg-1 hover:bg-void-bg-1 void-focus-ring"
					aria-label="Open Recode settings"
					title="Settings"
					onClick={() => commandService.executeCommand(CORTEXIDE_OPEN_SETTINGS_ACTION_ID)}
				>
					<Settings2 className="size-3.5" />
				</button>
			</div>
		</div>
	);
};
