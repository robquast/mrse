# Contributing to MrSE

Thank you for your interest in contributing to MrSE! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/mrse.git`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Commit your changes: `git commit -am 'Add some feature'`
6. Push to the branch: `git push origin feature/your-feature-name`
7. Submit a pull request

## Development Setup

1. Follow the installation instructions in README.md
2. Ensure PostgreSQL is running locally
3. Set up your `.env` file with development credentials
4. Run `npm run dev` to start the development server

## Code Style

- We use TypeScript for type safety
- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

## Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Run `npm test` to execute tests

## Commit Messages

- Use clear and descriptive commit messages
- Start with a verb in present tense (e.g., "Add", "Fix", "Update")
- Keep the first line under 50 characters
- Add detailed description if needed

Example:
```
Add email notification scheduling

- Implement cron-based email scheduler
- Add user preference settings
- Include email templates for notifications
```

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Ensure your code follows the style guidelines
3. Update tests as appropriate
4. Request review from maintainers

## Reporting Issues

- Use GitHub Issues to report bugs
- Include steps to reproduce the issue
- Provide system information (OS, Node version, etc.)
- Include relevant error messages or logs

## Feature Requests

- Open an issue to discuss new features
- Explain the use case and benefits
- Be open to feedback and alternative solutions

## Questions?

Feel free to open an issue for any questions about contributing.