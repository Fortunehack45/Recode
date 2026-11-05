/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useMemo } from 'react';
import { Sparkles, Bug, TestTube, Lightbulb } from 'lucide-react';
import { FileAccess } from '../../../../../../../base/common/network.js';

export type LandingPageProps = {
	onSubmitPrompt: (text: string) => void;
};

const STARTER_PROMPTS = [
	{
		icon: Lightbulb,
		title: 'Explain this file',
		desc: 'Walk through key functions and architecture',
		prompt: 'Explain the architecture and main functions of the currently open file.',
	},
	{
		icon: Sparkles,
		title: 'Refactor & Improve',
		desc: 'Clean up code and optimize performance',
		prompt: 'Review the current file for code smells, clean up structure, and improve performance.',
	},
	{
		icon: TestTube,
		title: 'Generate Unit Tests',
		desc: 'Create comprehensive test coverage',
		prompt: 'Generate unit tests covering edge cases and main flows for the active file.',
	},
	{
		icon: Bug,
		title: 'Find & Fix Bugs',
		desc: 'Diagnose runtime and logical errors',
		prompt: 'Analyze this file for potential bugs, edge cases, and unhandled errors.',
	},
];

export const LandingPage = ({ onSubmitPrompt }: LandingPageProps) => {
	const logoUri = useMemo(
		() => FileAccess.asBrowserUri('vs/workbench/browser/media/recode-main.png').toString(true),
		[],
	);

	return (
		<div className='w-full h-full flex flex-col justify-between items-center px-4 py-8 overflow-y-auto void-scrollbar select-none'>
			{/* Top Hero: Recode Logo & Headline */}
			<div className='flex flex-col items-center text-center mt-auto mb-6'>
				<div className='relative flex items-center justify-center w-14 h-14 mb-3'>
					<div
						className='absolute inset-0 rounded-2xl opacity-20 blur-md pointer-events-none'
						style={{
							background: 'radial-gradient(circle, var(--vscode-focusBorder, #3b82f6) 0%, transparent 70%)',
						}}
					/>
					<img
						src={logoUri}
						alt='Recode'
						className='w-12 h-12 object-contain drop-shadow-[0_2px_12px_rgba(59,130,246,0.3)]'
					/>
				</div>
				<h1 className='text-lg font-semibold tracking-tight text-void-fg-1'>
					Recode
				</h1>
				<p className='text-xs text-void-fg-3 mt-1'>
					Autonomous AI code editor
				</p>
			</div>

			{/* Starter Prompt Cards - Sleek 2x2 grid */}
			<div className='w-full max-w-md grid grid-cols-1 sm:grid-cols-2 gap-2 mb-auto'>
				{STARTER_PROMPTS.map((item) => {
					const Icon = item.icon;
					return (
						<button
							key={item.title}
							type='button'
							className='flex flex-col text-left p-2.5 rounded-xl border border-void-border-3/70 bg-void-bg-1/40 hover:bg-void-bg-1/90 hover:border-void-border-2 transition-all duration-150 cursor-pointer group shadow-sm void-focus-ring'
							onClick={() => onSubmitPrompt(item.prompt)}
						>
							<div className='flex items-center gap-1.5 text-xs font-medium text-void-fg-1 group-hover:text-void-fg-1'>
								<Icon className='w-3.5 h-3.5 text-void-fg-3 group-hover:text-[var(--cortex-brand,#3b82f6)] transition-colors' />
								<span>{item.title}</span>
							</div>
							<span className='text-[11px] text-void-fg-3/80 mt-1 line-clamp-1'>
								{item.desc}
							</span>
						</button>
					);
				})}
			</div>

			{/* Subtle hints bar */}
			<div className='flex items-center justify-center gap-3 text-[11px] text-void-fg-3/60 pt-2'>
				<span><kbd className='px-1 py-0.5 rounded bg-void-bg-1 border border-void-border-3 text-[10px]'>@</kbd> context</span>
				<span>•</span>
				<span><kbd className='px-1 py-0.5 rounded bg-void-bg-1 border border-void-border-3 text-[10px]'>/</kbd> commands</span>
				<span>•</span>
				<span><kbd className='px-1 py-0.5 rounded bg-void-bg-1 border border-void-border-3 text-[10px]'>Enter</kbd> send</span>
			</div>
		</div>
	);
};
