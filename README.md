# PromptDiff

PromptDiff is an intentional, zero-database developer workspace designed for rapid LLM prompt engineering and qualitative evaluation.

When building AI features, tweaking system instructions—even changing a single word or shifting a tone constraint can drastically alter the model's output behavior, consistency, and structural adherence. Tracking these shifts in your head or shuffling text files back and forth is incredibly friction-heavy.

**Live demo:** [prompt-diff.netlify.app](https://prompt-diff.netlify.app/)

## Why

Small wording changes can swing LLM output quality a lot, and it's easy to lose track of which version actually worked better. PromptDiff runs prompt A and prompt B against one variable and shows the outputs next to each other, so the difference is obvious instead of something you have to remember.

## What it does

- Edit two prompts (A/B)
- Plug in a single test variable
- Run both against the model
- Compare the outputs side by side

It's intentionally narrow, no dataset support, no analytics, no hosted key management. Just a fast local loop for "does this prompt change actually help."

## Running it

```bash
npm install
npm run dev
```

## Stack

React + TypeScript + Vite.