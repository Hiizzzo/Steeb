# GitHub API Reference for STEEB Issues Management

## Repository API Endpoints

### Issues
```http
GET /repos/{owner}/{repo}/issues
POST /repos/{owner}/{repo}/issues
GET /repos/{owner}/{repo}/issues/{issue_number}
PATCH /repos/{owner}/{repo}/issues/{issue_number}

# Examples
GET https://api.github.com/repos/santi-billy1/stebe/issues
POST https://api.github.com/repos/santi-billy1/stebe/issues
PATCH https://api.github.com/repos/santi-billy1/stebe/issues/123
```

### Pull Requests
```http
GET /repos/{owner}/{repo}/pulls
POST /repos/{owner}/{repo}/pulls
GET /repos/{owner}/{repo}/pulls/{pull_number}
PATCH /repos/{owner}/{repo}/pulls/{pull_number}

# Examples
GET https://api.github.com/repos/santi-billy1/stebe/pulls
POST https://api.github.com/repos/santi-billy1/stebe/pulls
```

### Labels
```http
GET /repos/{owner}/{repo}/labels
POST /repos/{owner}/{repo}/labels

# Examples
GET https://api.github.com/repos/santi-billy1/stebe/labels
POST https://api.github.com/repos/santi-billy1/stebe/labels
```

### Comments
```http
GET /repos/{owner}/{repo}/issues/{issue_number}/comments
POST /repos/{owner}/{repo}/issues/{issue_number}/comments

# Examples
GET https://api.github.com/repos/santi-billy1/stebe/issues/123/comments
POST https://api.github.com/repos/santi-billy1/stebe/issues/123/comments
```

## Webhook Events

### Issue Events
- `issues.opened` - New issue created
- `issues.closed` - Issue closed
- `issues.reopened` - Issue reopened
- `issues.edited` - Issue edited
- `issues.labeled` - Label added to issue
- `issues.unlabeled` - Label removed from issue
- `issues.milestoned` - Milestone added to issue
- **issues.demilestoned** - Milestone removed from issue
- `issues.assigned` - Issue assigned
- **issues.unassigned** - Issue unassigned

### Pull Request Events
- `pull_request.opened` - New pull request
- `pull_request.closed` - Pull request closed
- `pull_request.reopened` - Pull request reopened
- `pull_request.edited` - Pull request edited
- `pull_request.ready_for_review` - Ready for review
- `pull_request.review_requested` - Review requested
- `pull_request.review_request_removed` - Review request removed
- **pull_request.merged** - Pull request merged

### Repository Events
- `push` - Code pushed to repository
- `create` - Branch or tag created
- `delete` - Branch or tag deleted
- `release` - Release published

## Rate Limits

### API Rate Limits
- **Authenticated requests:** 5,000 per hour
- **Unauthenticated requests:** 60 per hour

### Search API Rate Limits
- **Authenticated requests:** 30 per minute
- **Unauthenticated requests:** 10 per minute

## Authentication

### Personal Access Token
```python
from github import Github

# Using personal access token
g = Github("your_personal_access_token")
```

### GitHub App Authentication
```python
from github import GithubIntegration

# Using GitHub App
integration = GithubIntegration(
    app_id="your_app_id",
    private_key="your_private_key"
)
g = integration.get_installation("installation_id").get_github_for_installation()
```

## Query Parameters

### Filtering Issues
```javascript
// Get issues with specific labels
GET /repos/{owner}/{repo}/issues?labels=bug,high

// Get issues in specific state
GET /repos/{owner}/{repo}/issues?state=open

// Get issues by assignee
GET /repos/{owner}/{repo}/issues?assignee=username

// Get issues by milestone
GET /repos/{owner}/{repo}/issues?milestone=v1.0

// Get issues by creation date
GET /repos/{owner}/{repo}/issues?since=2024-01-01

// Sort issues
GET /repos/{owner}/{repo}/issues?sort=created
GET /repos/{owner}/{repo}/issues?sort=updated
GET /repos/{owner}/{repo}/issues?sort=comments
```

### Pagination
```javascript
// Get issues with pagination
GET /repos/{owner}/{repo}/issues?page=2&per_page=50

// Default per_page is 30, maximum is 100
```

## Search API

### Searching Issues
```javascript
// Search in repository
GET /search/issues?q=repo:{owner}/{repo}+{query}

// Search for bugs
GET /search/issues?q=repo:{owner}/{repo}+label:bug

// Search for open issues
GET /search/issues?q=repo:{owner}/{repo}+state:open

// Search by author
GET /search/issues?q=repo:{owner}/{repo}+author:{username}

// Search with multiple qualifiers
GET /search/issues?q=repo:{owner}/{repo}+label:bug+state:open+created:>2024-01-01
```

## Error Handling

### Common Error Responses
```javascript
// 404 Not Found
{
  "message": "Not Found",
  "documentation_url": "https://docs.github.com/rest/reference"
}

// 403 Forbidden
{
  "message": "API rate limit exceeded",
  "documentation_url": "https://docs.github.com/rest/reference"
}

// 401 Unauthorized
{
  "message": "Requires authentication",
  "documentation_url": "https://docs.github.com/rest/reference"
}

// 422 Unprocessable Entity
{
  "message": "Validation Failed",
  "errors": [
    {
      "resource": "Issue",
      "field": "title",
      "code": "missing_field"
    }
  ]
}
```

## Best Practices

### Error Handling
```python
try:
    issue = repo.get_issue(issue_number)
except GithubException as e:
    if e.status == 404:
        print(f"Issue {issue_number} not found")
    elif e.status == 403:
        print("API rate limit exceeded")
    else:
        print(f"Error: {e}")
```

### Retry Logic
```python
import time
from datetime import datetime, timedelta

def get_issue_with_retry(repo, issue_number, max_retries=3):
    for attempt in range(max_retries):
        try:
            return repo.get_issue(issue_number)
        except GithubException as e:
            if e.status == 403:  # Rate limit
                retry_after = e.headers.get('Retry-After', 60)
                time.sleep(int(retry_after))
            elif attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
            else:
                raise

    raise GithubException(f"Failed to get issue after {max_retries} attempts")
```

### Batch Operations
```python
# Get multiple issues efficiently
issues = []
page = 1
per_page = 100

while True:
    batch = list(repo.get_issues(state='open', page=page, per_page=per_page))
    if not batch:
        break
    issues.extend(batch)
    page += 1

print(f"Retrieved {len(issues)} issues")
```

## GitHub CLI Equivalents

### Common Commands
```bash
# List issues
gh issue list --repo santi-billy1/stebe

# List issues with labels
gh issue list --repo santi-billy1/stebe --label "bug,high"

# Create issue
gh issue create --repo santi-billy1/stebe --title "Bug Report" --body "Description"

# Close issue
gh issue close 123

# Add label
gh issue edit 123 --add-label "urgent"

# Remove label
gh issue edit 123 --remove-label "urgent"
```

## STEEB-Specific Implementation

### Repository Configuration
```yaml
# STEEB Repository Settings
default_branch: main
protected_branches:
  - main
  - develop
issues:
  - enable_funding_links: true
  - enable_reactions: true
projects:
  - development
  - bug-triage
  - feature-requests
```

### Workflow Configuration
```yaml
# STEEB Issue Workflow
name: Issue Triage
on:
  issues:
    types: [opened, reopened]

jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
      - name: Analyze issue
        uses: ./.github/actions/analyze-issue.yml

      - name: Categorize
        uses: ./.github/actions/categorize-issue.yml

      - name: Assign labels
        uses: ./.github/actions/assign-labels.yml

      - name: Create response
        uses: ./.github/actions/create-response.yml
```

### Issue Templates
```markdown
<!-- .github/ISSUE_TEMPLATE/bug_report.md -->
---
name: Bug Report
about: Report a bug in STEEB
title: "[BUG] "
labels: bug
---

## Bug Description
A clear and concise description of what the bug is.

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
A clear description of what you expected to happen.

## Actual Behavior
A clear description of what actually happened.

## Screenshots
If applicable, add screenshots to help explain your problem.

## Environment
- **STEEB Version:** [e.g., 1.0.0]
- **Platform:** [e.g., iOS 15, Android 12, Web]
- **Browser:** [e.g., Chrome 91, Safari 14]

## Additional Context
Add any other context about the problem here.
```

## Performance Optimization

### Caching
- Cache frequently accessed issue data
- Implement local storage for recent issues
- Use conditional requests based on modification dates

### Async Operations
- Use asyncio for concurrent API calls
- Implement streaming for large result sets
- Use connection pooling for multiple requests

### Data Validation
- Validate issue data before processing
- Implement schema validation for consistency
- Sanitize user input to prevent issues