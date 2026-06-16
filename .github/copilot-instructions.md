<!-- SPECKIT START -->

For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at specs/002-vocabulary-history-flow/plan.md

<!-- SPECKIT END -->

## Git Commit Message Convention

- When suggesting commit messages, follow Conventional Commits 1.0.0: https://www.conventionalcommits.org/en/v1.0.0/#specification
- Use this format:
  - `<type>[optional scope]: <description>`
  - `[optional body]`
  - `[optional footer(s)]`
- Keep subject line short, imperative, and lowercase (except proper nouns)
- Common `type` values:
  - `feat` for new features
  - `fix` for bug fixes
  - `docs` for documentation only changes
  - `style` for formatting/style-only changes
  - `refactor` for code changes that are neither fixes nor features
  - `perf` for performance improvements
  - `test` for adding/updating tests
  - `build` for build system or dependency changes
  - `ci` for CI configuration or scripts
  - `chore` for maintenance tasks
  - `revert` for reverting previous commits
- Use `!` after type/scope for breaking changes, and include a `BREAKING CHANGE:` footer with details
- If a scope is known, include it (for example: `telegram`, `facebook`, `llm`, `channels`, `config`)

### Commit Message Examples

- `feat(telegram): add rate limit handling for message polling`
- `fix(facebook): handle expired oauth token refresh`
- `refactor(llm): split gemini retry logic into helper`
- `chore(deps): bump telethon to latest compatible version`
- `feat(api)!: remove legacy summary endpoint`
- `feat(api): remove legacy summary endpoint`
  - `BREAKING CHANGE: /summary endpoint has been removed; use /v2/summary instead`
