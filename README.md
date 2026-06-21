# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  # PromptDiff

  What it is and how to run it
  - A tiny React+Vite tool to compare two prompt versions (A/B) against a test variable and preview model outputs. Run locally:

  ```bash
  npm install
  npm run dev
  ```

  Who it's for and the one job it must do well
  - For prompt engineers and writers who want a fast, repeatable A/B prompt comparison. One job: reliably show human-readable model responses for two prompts using the same input.

  Why this problem, and why it's worth solving
  - Small prompt changes can dramatically change LLM output quality. PromptDiff makes those differences obvious and repeatable so you can iterate faster and safer.

  What's already out there and why this exists
  - There are generic playgrounds and experiment UIs from LLM vendors; this project focuses only on side-by-side prompt comparison with a variable bench — simple, local, and workflow-focused.

  Scope: what I included and what I left out
  - In scope: editing two prompts, substituting a single test variable, running both prompts against a model, and showing outputs.\
  - Out of scope: production-grade orchestration, multi-input datasets, result analytics, and secure hosted key management.



