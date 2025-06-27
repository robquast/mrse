#!/bin/bash
#
# Enhanced commit script with risk assessment and detailed logging
#

set -e

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Risk levels
HIGH_RISK="🔴 HIGH RISK"
MEDIUM_RISK="🟡 MEDIUM RISK" 
LOW_RISK="🟢 LOW RISK"

echo -e "${BLUE}📝 MrSE Enhanced Commit Tool${NC}"
echo "=================================="

# Check git status
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  No changes to commit${NC}"
    exit 0
fi

echo "📋 Current changes:"
git status --short

echo ""
echo "🔍 Risk Assessment Questions:"
echo ""

# Ask about change type
echo "What type of change is this?"
echo "1) feat - New feature"
echo "2) fix - Bug fix" 
echo "3) docs - Documentation"
echo "4) style - Formatting/styling"
echo "5) refactor - Code restructuring"
echo "6) perf - Performance improvement"
echo "7) test - Adding tests"
echo "8) chore - Maintenance"
echo "9) security - Security fix/improvement"
echo "10) breaking - Breaking change"

read -p "Select type (1-10): " choice

case $choice in
    1) type="feat" ;;
    2) type="fix" ;;
    3) type="docs" ;;
    4) type="style" ;;
    5) type="refactor" ;;
    6) type="perf" ;;
    7) type="test" ;;
    8) type="chore" ;;
    9) type="security" ;;
    10) type="breaking" ;;
    *) echo -e "${RED}Invalid choice${NC}"; exit 1 ;;
esac

# Risk assessment
echo ""
echo "🎯 Risk Assessment:"

# Check for high-risk indicators
high_risk_files=$(git diff --cached --name-only | grep -E "(schema\.sql|migration|auth|config|\.env)" || true)
database_changes=$(git diff --cached | grep -E "(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE)" || true)
dependency_changes=$(git diff --cached --name-only | grep -E "(package\.json|package-lock\.json)" || true)

risk_level=""
risk_reasons=()

if [ ! -z "$high_risk_files" ] || [ ! -z "$database_changes" ]; then
    risk_level="$HIGH_RISK"
    [ ! -z "$high_risk_files" ] && risk_reasons+=("Critical files modified")
    [ ! -z "$database_changes" ] && risk_reasons+=("Database schema changes")
elif [ ! -z "$dependency_changes" ] || [ "$type" = "breaking" ] || [ "$type" = "security" ]; then
    risk_level="$MEDIUM_RISK"
    [ ! -z "$dependency_changes" ] && risk_reasons+=("Dependencies modified")
    [ "$type" = "breaking" ] && risk_reasons+=("Breaking changes")
    [ "$type" = "security" ] && risk_reasons+=("Security-related changes")
else
    risk_level="$LOW_RISK"
    risk_reasons+=("Standard development changes")
fi

echo -e "Risk Level: $risk_level"
printf '%s\n' "${risk_reasons[@]}" | sed 's/^/  - /'

# For high/medium risk, ask additional questions
if [[ "$risk_level" == *"HIGH"* ]] || [[ "$risk_level" == *"MEDIUM"* ]]; then
    echo ""
    echo "⚠️  This is a risky change. Please provide additional details:"
    
    read -p "🎯 What is the business justification? " justification
    read -p "📊 What testing was performed? " testing
    read -p "🔄 What is the rollback plan? " rollback
    read -p "👥 Who should review this change? " reviewers
fi

# Get commit details
echo ""
read -p "📝 Brief description (max 50 chars): " description
echo ""
echo "📄 Detailed explanation (press Ctrl+D when done):"
detailed_description=$(cat)

# Build commit message
commit_msg="$type: $description"

if [ ! -z "$detailed_description" ]; then
    commit_msg="$commit_msg

$detailed_description"
fi

# Add risk assessment to commit message
commit_msg="$commit_msg

Risk Assessment: $risk_level"
printf '%s\n' "${risk_reasons[@]}" | sed 's/^/- /' | while read line; do
    commit_msg="$commit_msg
$line"
done

# Add additional details for risky changes
if [[ "$risk_level" == *"HIGH"* ]] || [[ "$risk_level" == *"MEDIUM"* ]]; then
    commit_msg="$commit_msg

Justification: $justification
Testing: $testing  
Rollback: $rollback
Reviewers: $reviewers"
fi

# Add files changed
commit_msg="$commit_msg

Files changed:"
git diff --cached --name-only | sed 's/^/- /' | while read line; do
    commit_msg="$commit_msg
$line"
done

commit_msg="$commit_msg

🤖 Generated with MrSE commit tool"

# Show preview
echo ""
echo -e "${BLUE}📋 Commit Message Preview:${NC}"
echo "=================================="
echo "$commit_msg"
echo "=================================="
echo ""

read -p "Proceed with commit? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Commit cancelled${NC}"
    exit 0
fi

# Stage all changes and commit
git add .
git commit -m "$commit_msg"

echo -e "${GREEN}✅ Commit successful!${NC}"

# Update changelog for significant changes
if [[ "$risk_level" == *"HIGH"* ]] || [[ "$risk_level" == *"MEDIUM"* ]]; then
    echo ""
    echo -e "${BLUE}📖 Updating CHANGELOG.md${NC}"
    
    # Add entry to changelog
    today=$(date +%Y-%m-%d)
    changelog_entry="### $type: $description - $today $risk_level

- $detailed_description
- Risk factors: $(IFS=', '; echo "${risk_reasons[*]}")
- Testing: $testing
- Rollback: $rollback
"
    
    # Insert after [Unreleased] section
    sed -i '' "/## \[Unreleased\]/a\\
\\
$changelog_entry" CHANGELOG.md
    
    git add CHANGELOG.md
    git commit --amend --no-edit
    
    echo -e "${GREEN}✅ CHANGELOG.md updated${NC}"
fi

echo ""
echo -e "${BLUE}🚀 Ready to push? Run: git push origin main${NC}"