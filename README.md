# Human-in-the-Loop

Provide interactive decision-making capabilities for Agent Zero via frontend modals.

## What It Does

This plugin allows the agent to pause execution and present a series of questions to the user through a polished, tabbed popup modal. It supports predefined options, custom text input, and batch submission of answers.

## Main Behavior

- **Agent Pause**: Blocks agent execution until the user responds.
- **Multi-Step Tabs**: Supports a series of questions with intuitive tab navigation.
- **Auto-Advance**: Automatically moves to the next question upon selection.
- **Text Input**: Supports custom text answers alongside predefined options.
- **Batch Submission**: Collects all answers and submits them together to resume the agent.

## Key Files

- **Tools**
  - `tools/hitl_ask.py`
- **API**
  - `api/hitl_status.py`
  - `api/hitl_submit.py`
- **Frontend**
  - `webui/hitl_store.js`
  - `webui/hitl_modal.html`

## Configuration Scope

- **Settings section**: `agent`
- **Per-project config**: `false`
- **Per-agent config**: `false`

## Tool Visibility & System Prompt Injection

The `hitl_ask` tool is automatically discovered by the Agent Zero framework at runtime. It is dynamically injected into the agent's system prompt under the `## available tools` section via the `{{tools}}` placeholder defined in `/a0/prompts/agent.system.tools.md`. No manual prompt editing is required for registration.

## Behavioral Rules & Prompt Customization

To enforce specific usage patterns or add instructions for this tool, you can dynamically update the agent's persistent behavioral rules by asking the agent to use the `behaviour_adjustment` tool. 

For example, you can instruct the agent:
> "Add a behavioral rule: When asking the user a question, use the `hitl_ask` tool instead of `response` to ask questions in the course of task execution."

The framework will automatically persist these rules, ensuring they apply to future interactions without requiring manual file edits or prompt modifications.

## Plugin Metadata

- **Name**: `human_in_the_loop`
- **Title**: `Human in the Loop`
- **Description**: Provides interactive decision-making capabilities via frontend modals.
