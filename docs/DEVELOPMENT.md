# Development Guidelines

## Git Workflow & Commit Standards

### Commit Message Format

We follow conventional commits with risk assessment:

```
<type>: <description>

<body>

Risk Assessment: 🔴/🟡/🟢 <RISK_LEVEL>
- <risk factors>

<additional details for risky changes>
```

### Commit Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Formatting, missing semicolons, etc
- **refactor**: Code change that neither fixes bug nor adds feature
- **perf**: Performance improvement
- **test**: Adding missing tests
- **chore**: Maintenance, dependencies, build tools
- **security**: Security fixes or improvements
- **breaking**: Breaking changes (use ! after type)

### Risk Assessment Levels

#### 🔴 HIGH RISK
**Requires**: Detailed justification, testing plan, rollback strategy, reviewer assignment

**Triggers**:
- Database schema changes (`schema.sql`, migrations)
- Authentication/authorization changes
- Configuration changes affecting production
- Breaking API changes
- Security-sensitive code modifications

**Required Information**:
- Business justification
- Comprehensive testing performed
- Detailed rollback plan
- Assigned reviewers
- Impact assessment

#### 🟡 MEDIUM RISK
**Requires**: Basic justification, testing notes, rollback plan

**Triggers**:
- New dependencies (`package.json` changes)
- Feature modifications
- Performance changes
- Non-breaking API changes
- Infrastructure updates

#### 🟢 LOW RISK
**Requires**: Standard commit message

**Triggers**:
- Bug fixes
- Documentation updates
- Code formatting
- Minor improvements
- Test additions

### Enhanced Commit Tool

Use the provided commit tool for guided commits with risk assessment:

```bash
./scripts/commit-template.sh
```

This tool will:
- Analyze changed files for risk indicators
- Guide you through risk assessment
- Generate properly formatted commit messages
- Update CHANGELOG.md for significant changes
- Ensure all required information is captured

### Setting Up Git Configuration

Configure git to use our commit message template:

```bash
git config commit.template .gitmessage
```

Install pre-commit hooks:

```bash
cp scripts/git-hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### Branch Strategy

- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/***: Individual feature development
- **hotfix/***: Critical production fixes
- **release/***: Release preparation

### Mandatory Practices

#### Before Any Risky Change
1. **Create feature branch**: `git checkout -b feature/description`
2. **Document the change**: Update relevant documentation
3. **Test thoroughly**: Run full test suite
4. **Use commit tool**: `./scripts/commit-template.sh`
5. **Create pull request**: For review and discussion

#### Database Changes (HIGH RISK)
1. **Never alter schema directly** in production
2. **Create migration scripts** with rollback procedures
3. **Test migrations** on copy of production data
4. **Document impact** on existing data and applications
5. **Plan maintenance window** if needed

#### Authentication Changes (HIGH RISK)
1. **Test OAuth flow** thoroughly
2. **Verify session handling** remains secure
3. **Check token validation** and expiration
4. **Test logout/cleanup** procedures
5. **Validate permissions** and access controls

#### Configuration Changes (MEDIUM-HIGH RISK)
1. **Document environment variables** in README
2. **Provide example values** in .env.example
3. **Test configuration** in development environment
4. **Plan deployment** coordination
5. **Verify backward compatibility**

### Emergency Procedures

#### Hotfix Process
1. **Create hotfix branch** from main
2. **Implement minimal fix** with HIGH RISK assessment
3. **Test thoroughly** in staging environment
4. **Fast-track review** with senior developer
5. **Deploy and monitor** closely

#### Rollback Process
1. **Identify commit** to rollback to
2. **Check dependencies** and data implications
3. **Create rollback branch**: `git checkout -b rollback/description`
4. **Revert commits**: `git revert <commit-hash>`
5. **Test rollback** thoroughly
6. **Deploy with monitoring**

### Code Review Requirements

#### All Changes
- [ ] Code follows project style guidelines
- [ ] Tests added/updated for new functionality
- [ ] Documentation updated if needed
- [ ] No sensitive data committed

#### Medium Risk Changes
- [ ] Business justification provided
- [ ] Testing approach documented
- [ ] Rollback plan defined
- [ ] One senior developer approval

#### High Risk Changes
- [ ] Detailed impact assessment
- [ ] Comprehensive testing plan executed
- [ ] Multiple reviewer approvals required
- [ ] Deployment plan coordinated
- [ ] Monitoring plan in place

### Continuous Integration

Our GitHub Actions pipeline automatically:
- Runs TypeScript compilation
- Executes test suite
- Builds Docker images
- Checks for security vulnerabilities
- Validates commit message format

### Monitoring and Logging

For production deployments, ensure:
- Application logs are captured
- Database performance is monitored
- Error tracking is configured
- User session analytics available
- System resource monitoring active

### Security Considerations

Always check for:
- Hardcoded secrets or tokens
- SQL injection vulnerabilities
- XSS attack vectors
- CSRF protection
- Input validation
- Output encoding
- Authentication bypass
- Authorization flaws

### Performance Guidelines

Monitor and optimize:
- Database query performance
- API response times
- Memory usage patterns
- CPU utilization
- Network latency
- Cache effectiveness