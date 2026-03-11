# 🤝 Contributing to Spark

Thanks for your interest in contributing to Spark and the OpenClaw framework.

## Areas to Contribute

### 📡 New Signal Detectors

Add new signal sources in `src/momentum/`. Each detector should:
- Implement a consistent scoring interface (return 0–N points)
- Be independently testable
- Include unit tests

### 💹 New DEX Integrations

Add DEX adapters in `src/trading/`. Currently supported: Jupiter.
Raydium, Orca, Meteora are good candidates.

### 🐦 New Social Sources

Add social monitoring in `src/twitter/`. Telegram and Discord monitoring
would significantly improve signal quality.

### 📖 Documentation

All documentation improvements welcome. Especially:
- More detailed signal explanations in `docs/SIGNALS.md`
- Architecture diagrams
- Usage examples

## Pull Request Process

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Write tests for new functionality
4. Ensure `npm run lint` and `npm run test` pass
5. Submit PR with clear description of changes

## Code Style

- TypeScript strict mode — no `any` types
- Named exports preferred over default exports (except for classes)
- All async functions should handle errors explicitly
- Log important state transitions with the logger

## Commit Format

```
type(scope): description

feat(momentum): add telegram channel monitoring
fix(trading): handle Jupiter timeout correctly
docs(readme): update architecture diagram
test(scorer): add velocity edge case tests
```
