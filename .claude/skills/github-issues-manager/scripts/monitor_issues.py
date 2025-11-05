#!/usr/bin/env python3
"""
STEEB GitHub Issues Monitor
Monitors GitHub repository for new issues and triggers automated workflows
"""

import argparse
import json
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any

try:
    import requests
    from github import Github
    from github.GithubException import GithubException
except ImportError as e:
    print(f"❌ Missing required packages: {e}")
    print("Install with: pip install PyGithub requests")
    sys.exit(1)

class GitHubIssuesMonitor:
    def __init__(self, token: str, repo_name: str):
        """Initialize the GitHub Issues Monitor"""
        self.github = Github(token)
        self.repo = self.github.get_repo(repo_name)
        self.repo_name = repo_name

        # Track processed issues to avoid duplicates
        self.processed_issues_file = Path("processed_issues.json")
        self.processed_issues = self.load_processed_issues()

        # STEEB-specific configurations
        self.steeb_labels = {
            'bug': ['bug', 'error', 'crash', 'broken'],
            'feature': ['feature', 'enhancement', 'new'],
            'documentation': ['documentation', 'docs', 'readme'],
            'ui': ['ui', 'ux', 'interface', 'design'],
            'backend': ['backend', 'api', 'server'],
            'mobile': ['mobile', 'ios', 'android'],
            'performance': ['performance', 'slow', 'optimization'],
            'critical': ['critical', 'urgent', 'blocker'],
            'question': ['question', 'help', 'how to']
        }

        # STEEB team members for assignment
        self.steeb_team = {
            'Santi': 'santi-billy1',
            'UI/UX': 'design-team',
            'Backend': 'backend-team',
            'Mobile': 'mobile-team',
            'QA': 'qa-team'
        }

    def load_processed_issues(self) -> Dict[str, datetime]:
        """Load previously processed issues"""
        if self.processed_issues_file.exists():
            try:
                with open(self.processed_issues_file, 'r') as f:
                    data = json.load(f)
                return {
                    issue_id: datetime.fromisoformat(timestamp)
                    for issue_id, timestamp in data.items()
                }
            except Exception as e:
                print(f"⚠️  Error loading processed issues: {e}")
                return {}
        return {}

    def save_processed_issues(self):
        """Save processed issues to file"""
        try:
            data = {
                issue_id: timestamp.isoformat()
                for issue_id, timestamp in self.processed_issues.items()
            }
            with open(self.processed_issues_file, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"⚠️  Error saving processed issues: {e}")

    def categorize_issue(self, issue) -> List[str]:
        """Categorize issue based on content and labels"""
        categories = []
        content = f"{issue.title} {issue.body}".lower()

        # Check against STEEB-specific keywords
        for category, keywords in self.steeb_labels.items():
            if any(keyword in content for keyword in keywords):
                categories.append(category)

        # Add default category if none matched
        if not categories:
            categories.append('question')

        return categories

    def assess_severity(self, issue) -> str:
        """Assess issue severity based on content and reactions"""
        content = f"{issue.title} {issue.body}".lower()

        # Critical indicators
        critical_keywords = ['critical', 'urgent', 'blocker', 'crash', 'security']
        if any(keyword in content for keyword in critical_keywords):
            return 'critical'

        # High severity indicators
        high_keywords = ['bug', 'error', 'broken', 'not working', 'regression']
        if any(keyword in content for keyword in high_keywords):
            return 'high'

        # Medium severity indicators
        medium_keywords = ['improve', 'enhancement', 'optimize', 'better']
        if any(keyword in content for keyword in medium_keywords):
            return 'medium'

        # Check reactions (thumbs up/down)
        reactions = issue.reactions
        if reactions.total_count > 5:  # High engagement
            return 'high'
        elif reactions.total_count > 2:
            return 'medium'

        return 'low'

    def estimate_complexity(self, issue) -> str:
        """Estimate development complexity based on content"""
        content = f"{issue.title} {issue.body}".lower()

        # Complex indicators
        complex_keywords = ['architecture', 'database', 'api', 'integration', 'refactor']
        if any(keyword in content for keyword in complex_keywords):
            return 'complex'

        # Medium complexity
        medium_keywords = ['feature', 'implement', 'add', 'create']
        if any(keyword in content for keyword in medium_keywords):
            return 'medium'

        return 'simple'

    def generate_issue_response(self, issue) -> Dict[str, Any]:
        """Generate automated response for the issue"""
        severity = self.assess_severity(issue)
        categories = self.categorize_issue(issue)
        complexity = self.estimate_complexity(issue)

        # STEEB-specific response templates
        responses = {
            'bug': {
                'title': f"🐛 Bug Analysis: {issue.title}",
                'body': self.generate_bug_response(issue, severity, complexity)
            },
            'feature': {
                'title': f"✨ Feature Request: {issue.title}",
                'body': self.generate_feature_response(issue, severity, complexity)
            },
            'enhancement': {
                'title': f"💡 Enhancement: {issue.title}",
                'body': self.generate_enhancement_response(issue, severity, complexity)
            },
            'documentation': {
                'title': f"📚 Documentation: {issue.title}",
                'body': self.generate_documentation_response(issue, severity, complexity)
            },
            'question': {
                'title': f"❓ Question: {issue.title}",
                'body': self.generate_question_response(issue, severity, complexity)
            }
        }

        # Get primary category
        primary_category = categories[0] if categories else 'question'

        response = {
            'issue_number': issue.number,
            'title': issue.title,
            'author': issue.user.login,
            'categories': categories,
            'severity': severity,
            'complexity': complexity,
            'created_at': issue.created_at.isoformat(),
            'labels': [label.name for label in issue.labels],
            'reactions': {
                'total': issue.reactions.total_count,
                'thumbs_up': issue.reactions.get('thumbs_up', 0),
                'thumbs_down': issue.reactions.get('thumbs_down', 0),
                'laugh': issue.reactions.get('laugh', 0),
                'heart': issue.reactions.get('heart', 0)
            },
            'response': responses.get(primary_category, responses['question']),
            'actions': self.generate_action_items(issue, primary_category, severity, complexity),
            'estimated_timeline': self.estimate_timeline(complexity, severity)
        }

        return response

    def generate_bug_response(self, issue, severity, complexity) -> str:
        """Generate response for bug issues"""
        response = f"""
## 🔍 Bug Analysis Report

**Issue:** {issue.title}
**Severity:** {severity.upper()}
**Complexity:** {complexity.upper()}
**Reported by:** {issue.user.login}

### 📋 Problem Description
{issue.body or 'No description provided'}

### 🎯 Investigation Plan
{'🚨 URGENT - This bug needs immediate attention' if severity == 'critical' else
'⚡ HIGH PRIORITY - Address this bug soon' if severity == 'high' else
'📅 Schedule for next sprint' if severity == 'medium' else
'📝 Add to backlog'}

### 🔧 STEEB-Specific Actions
- [ ] Reproduce bug in development environment
- [ ] Identify affected components
- [ ] Create minimal reproduction case
- [ ] Fix the underlying issue
- [ ] Add regression tests
- [ ] Update affected documentation

### 📊 Impact Assessment
- **User Impact:** {'High - Critical functionality affected' if severity == 'critical' else
                     'Medium - Some users affected' if severity == 'high' else
                     'Low - Limited user impact'}
- **Business Impact:** {'Blocks core functionality' if severity == 'critical' else
                        'Affects user experience' if severity == 'high' else
                        'Minor improvement'}

### ⏰ Timeline
{self.get_timeline_text(complexity, severity)}

### 🔄 Next Steps
{'Create hotfix immediately' if severity == 'critical' else
'Include in next release' if severity == 'high' else
'Schedule for development cycle'}

---
🤖 *This response was generated automatically by STEEB Issues Manager*
        """.strip()

        return response

    def generate_feature_response(self, issue, severity, complexity) -> str:
        """Generate response for feature requests"""
        response = f"""
## ✨ Feature Request Analysis

**Request:** {issue.title}
**Priority:** {severity.upper()}
**Complexity:** {complexity.upper()}
**Requested by:** {issue.user.login}

### 📋 Requirements
{issue.body or 'No requirements provided'}

### 🎯 STEEB Impact Assessment
{'🚀 HIGH IMPACT - This feature will significantly improve STEEB' if severity == 'high' else
'💡 MEDIUM IMPACT - Nice enhancement for users' if severity == 'medium' else
'📈 LOW IMPACT - Minor improvement'}

### 🔧 Implementation Approach
{self.get_implementation_plan(complexity)}

### 📊 Business Value
- **User Experience:** {'Major improvement' if severity == 'high' else
                       'Nice enhancement' if severity == 'medium' else
                       'Minor enhancement'}
- **Development Effort:** {complexity.lower()}
- **Expected ROI:** {'High' if severity == 'high' else
                      'Medium' if severity == 'medium' else
                      'Low'}

### ⏰ Development Timeline
{self.get_timeline_text(complexity, severity)}

### 🔄 Development Phases
1. Requirements Analysis & Design
2. Implementation & Testing
3. Documentation & Release

### 📋 Acceptance Criteria
- [ ] Feature implemented as specified
- [ ] Tests pass successfully
- [ ] Documentation updated
- [ ] User acceptance testing complete

---
🤖 *This response was generated automatically by STEEB Issues Manager*
        """.strip()

        return response

    def generate_enhancement_response(self, issue, severity, complexity) -> str:
        """Generate response for enhancement requests"""
        return f"""
## 💡 Enhancement Request Analysis

**Enhancement:** {issue.title}
**Priority:** {severity.upper()}
**Complexity:** {complexity.upper()}
**Requested by:** {issue.user.login}

### 📋 Enhancement Details
{issue.body or 'No details provided'}

### 🎯 STEEB Improvement Areas
- User Experience Optimization
- Performance Enhancement
- Feature Refinement
- Code Quality Improvement

### 📊 Value Proposition
Better performance and user experience for STEEB users

### ⏰ Implementation Timeline
{self.get_timeline_text(complexity, severity)}

---
🤖 *This response was generated automatically by STEEB Issues Manager*
        """.strip()

    def generate_documentation_response(self, issue, severity, complexity) -> str:
        """Generate response for documentation issues"""
        return f"""
## 📚 Documentation Request Analysis

**Documentation:** {issue.title}
**Priority:** {severity.upper()}
**Complexity:** {complexity.upper()}
**Requested by:** {issue.user.login}

### 📋 Documentation Details
{issue.body or 'No details provided'}

### 🎯 Documentation Updates
- README improvements
- API documentation updates
- User guide enhancements
- Code comments additions

### ⏰ Implementation Timeline
{self.get_timeline_text(complexity, severity)}

---
🤖 *This response was generated automatically by STEEB Issues Manager*
        """.strip()

    def generate_question_response(self, issue, severity, complexity) -> str:
        """Generate response for questions"""
        return f"""
## ❓ Question Analysis

**Question:** {issue.title}
**Priority:** {severity.upper()}
**Complexity:** {complexity.upper()}
**Asked by:** {issue.user.login}

### 📋 Question Details
{issue.body or 'No details provided'}

### 🎯 Response Plan
- Analyze the question
- Provide comprehensive answer
- Update relevant documentation if needed
- Consider feature request if applicable

### ⏰ Response Timeline
Within 24 hours for all questions

---
🤖 *This response was generated automatically by STEEB Issues Manager*
        """.strip()

    def get_implementation_plan(self, complexity) -> str:
        """Get implementation plan based on complexity"""
        plans = {
            'simple': 'This enhancement can be implemented in a single development cycle with minimal testing.',
            'medium': 'This requires 2-3 development cycles with proper testing and documentation.',
            'complex': 'This requires significant development time, multiple cycles, and thorough testing.'
        }
        return plans.get(complexity, plans['medium'])

    def get_timeline_text(self, complexity, severity) -> str:
        """Get timeline text based on complexity and severity"""
        timelines = {
            ('simple', 'critical'): 'Fix immediately - 1-2 days',
            ('simple', 'high'): 'Next release - 3-5 days',
            ('simple', 'medium'): 'Next sprint - 1-2 weeks',
            ('simple', 'low'): 'Next milestone - 2-3 weeks',
            ('medium', 'critical'): 'Hotfix required - 3-5 days',
            ('medium', 'high'): 'Next release - 1-2 weeks',
            ('medium', 'medium'): 'Next sprint - 2-3 weeks',
            ('medium', 'low'): 'Next milestone - 3-4 weeks',
            ('complex', 'critical'): 'Emergency patch - 1 week',
            ('complex', 'high'): 'Next major release - 2-3 weeks',
            ('complex', 'medium'): 'Next development cycle - 3-4 weeks',
            ('complex', 'low'): 'Future release - 1-2 months'
        }
        return timelines.get((complexity, severity), 'TBD')

    def generate_action_items(self, issue, category, severity, complexity) -> List[str]:
        """Generate action items for the issue"""
        actions = []

        if category == 'bug':
            actions.extend([
                'Reproduce the bug in development environment',
                'Identify root cause and affected components',
                'Create automated test case',
                'Implement fix and verify solution',
                'Add regression tests to prevent recurrence'
            ])
        elif category == 'feature':
            actions.extend([
                'Analyze requirements and create specification',
                'Design implementation approach',
                'Break down into development tasks',
                'Implement feature with proper testing',
                'Update documentation and user guides'
            ])
        elif category == 'documentation':
            actions.extend([
                'Identify documentation gaps',
                'Update relevant files',
                'Create examples and tutorials',
                'Review and validate accuracy'
            ])
        else:
            actions.extend([
                'Analyze the question thoroughly',
                'Provide comprehensive answer',
                'Update documentation if needed',
                'Consider follow-up actions'
            ])

        # Add STEEB-specific actions
        if 'ui' in category or 'ux' in category:
            actions.append('Review with UI/UX team')

        if 'mobile' in category:
            actions.append('Test on both iOS and Android platforms')

        if 'backend' in category:
            actions.append('Verify API compatibility and test endpoints')

        return actions

    def estimate_timeline(self, complexity, severity) -> str:
        """Estimate timeline for issue resolution"""
        base_timeline = {
            'simple': {'critical': '1-2 days', 'high': '3-5 days', 'medium': '1 week', 'low': '2 weeks'},
            'medium': {'critical': '3-5 days', 'high': '1-2 weeks', 'medium': '2-3 weeks', 'low': '3-4 weeks'},
            'complex': {'critical': '1 week', 'high': '2-3 weeks', 'medium': '3-4 weeks', 'low': '1-2 months'}
        }

        return base_timeline.get(complexity, base_timeline['medium']).get(severity, '2-3 weeks')

    def process_new_issues(self, webhook_data: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Process new issues from repository"""
        processed_issues = []

        try:
            # Get issues from webhook or API
            if webhook_data:
                issues = [self.repo.get_issue(webhook_data['issue']['number'])]
            else:
                # Get recent issues (last 24 hours)
                since = datetime.now() - timedelta(hours=24)
                issues = self.repo.get_issues(state='open', since=since)
                issues = list(issues)  # Convert to list for iteration

            for issue in issues:
                issue_id = str(issue.number)

                # Skip if already processed
                if issue_id in self.processed_issues:
                    continue

                # Generate response
                response = self.generate_issue_response(issue)
                processed_issues.append(response)

                # Mark as processed
                self.processed_issues[issue_id] = datetime.now()

                # Print summary
                print(f"✅ Processed Issue #{issue.number}: {issue.title}")
                print(f"   Category: {', '.join(response['categories'])}")
                print(f"   Severity: {response['severity']}")
                print(f"   Complexity: {response['complexity']}")
                print(f"   Timeline: {response['estimated_timeline']}")
                print()

            # Save processed issues
            self.save_processed_issues()

            return processed_issues

        except Exception as e:
            print(f"❌ Error processing issues: {e}")
            return []

    def create_automated_response(self, issue_number: int, response_data: Dict[str, Any]):
        """Create automated response comment on issue"""
        try:
            issue = self.repo.get_issue(issue_number)

            # Format response
            response_text = f"""
{response_data['response']['title']}

{response_data['response']['body']}

---
**🤖 Automated Analysis by STEEB Issues Manager**
- **Categories:** {', '.join(response_data['categories'])}
- **Severity:** {response_data['severity']}
- **Complexity:** {response_data['complexity']}
- **Timeline:** {response_data['estimated_timeline']}
            """.strip()

            # Create comment
            issue.create_comment(response_text)

            # Add labels
            labels_to_add = []
            for category in response_data['categories']:
                labels_to_add.append(category)

            labels_to_add.append(response_data['severity'])
            labels_to_add.append(response_data['complexity'])

            # Add existing labels
            for label in response_data['labels']:
                if label not in labels_to_add:
                    labels_to_add.append(label)

            issue.add_to_labels(*labels_to_add)

            print(f"✅ Created response for Issue #{issue_number}")

        except Exception as e:
            print(f"❌ Error creating response: {e}")

    def monitor_continuously(self, interval_minutes: int = 5):
        """Continuously monitor for new issues"""
        print(f"🔍 Starting GitHub Issues Monitor for {self.repo_name}")
        print(f"📊 Checking for new issues every {interval_minutes} minutes")
        print("Press Ctrl+C to stop monitoring")

        try:
            while True:
                print(f"\n🕐 Checking for new issues... ({datetime.now()})")

                # Get current issues
                since = datetime.now() - timedelta(minutes=interval_minutes)
                recent_issues = self.repo.get_issues(state='open', since=since)
                recent_issues = list(recent_issues)

                if recent_issues:
                    print(f"🎯 Found {len(recent_issues)} new issue(s)")
                    processed = self.process_new_issues()

                    for response in processed:
                        self.create_automated_response(response['issue_number'], response)
                else:
                    print("✅ No new issues found")

                # Wait for next check
                time.sleep(interval_minutes * 60)

        except KeyboardInterrupt:
            print("\n👋 Monitoring stopped by user")
        except Exception as e:
            print(f"❌ Error in monitoring: {e}")

def main():
    parser = argparse.ArgumentParser(description='Monitor GitHub Issues for STEEB repository')
    parser.add_argument('--token', '-t', required=True, help='GitHub access token')
    parser.add_argument('--repo', '-r', default='santi-billy1/stebe', help='Repository name (default: santi-billy1/stebe)')
    parser.add_argument('--interval', '-i', type=int, default=5, help='Monitoring interval in minutes (default: 5)')
    parser.add_argument('--once', '-o', action='store_true', help='Run once and exit')
    parser.add_argument('--webhook', '-w', help='Process webhook data from file')
    parser.add_argument('--output', '-O', help='Output file for processed issues')

    args = parser.parse_args()

    try:
        # Initialize monitor
        monitor = GitHubIssuesMonitor(args.token, args.repo)

        if args.webhook:
            # Process webhook data
            with open(args.webhook, 'r') as f:
                webhook_data = json.load(f)

            processed_issues = monitor.process_new_issues(webhook_data)

            if args.output:
                with open(args.output, 'w') as f:
                    json.dump(processed_issues, f, indent=2)
                print(f"✅ Results saved to {args.output}")

            for response in processed_issues:
                monitor.create_automated_response(response['issue_number'], response)

        elif args.once:
            # Run once
            processed_issues = monitor.process_new_issues()

            if args.output:
                with open(args.output, 'w') as f:
                    json.dump(processed_issues, f, indent=2)
                print(f"✅ Results saved to {args.output}")

            for response in processed_issues:
                monitor.create_automated_response(response['issue_number'], response)

        else:
            # Continuous monitoring
            monitor.monitor_continuously(args.interval)

    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()