#!/usr/bin/env python3
"""
STEEB Issue Report Generator
Generates comprehensive reports on GitHub issues for STEEB development
"""

import argparse
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any

try:
    from github import Github
    from github.GithubException import GithubException
    import matplotlib.pyplot as plt
    import pandas as pd
except ImportError as e:
    print(f"❌ Missing required packages: {e}")
    print("Install with: pip install PyGithub matplotlib pandas")
    sys.exit(1)

class STEEBIssueReporter:
    def __init__(self, token: str, repo_name: str = 'santi-billy1/stebe'):
        """Initialize the STEEB Issue Reporter"""
        self.github = Github(token)
        self.repo = self.github.get_repo(repo_name)
        self.repo_name = repo_name

    def generate_report(self, period: str = 'monthly') -> Dict[str, Any]:
        """Generate comprehensive issue report"""
        # Determine date range
        end_date = datetime.now()

        if period == 'daily':
            start_date = end_date - timedelta(days=1)
            date_format = '%Y-%m-%d'
        elif period == 'weekly':
            start_date = end_date - timedelta(weeks=1)
            date_format = '%Y-%W'
        elif period == 'monthly':
            start_date = end_date - timedelta(days=30)
            date_format = '%Y-%m'
        else:
            start_date = end_date - timedelta(days=30)
            date_format = '%Y-%m'

        print(f"📊 Generating STEEB Issues Report ({period})")
        print(f"📅 Period: {start_date.strftime(date_format)} to {end_date.strftime(date_format)}")

        # Get all issues in the period
        issues = list(self.repo.get_issues(
            state='all',
            since=start_date,
            until=end_date
        ))

        if not issues:
            print("ℹ️  No issues found in this period")
            return {}

        # Analyze issues
        report_data = {
            'period': period,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'total_issues': len(issues),
            'open_issues': len([i for i in issues if i.state == 'open']),
            'closed_issues': len([i for i in issues if i.state == 'closed']),
            'categories': self.categorize_issues(issues),
            'severity_distribution': self.analyze_severity(issues),
            'timeline': self.analyze_timeline(issues),
            'engagement': self.analyze_engagement(issues),
            'team_performance': self.analyze_team_performance(issues),
            'patterns': self.identify_patterns(issues),
            'recommendations': self.generate_recommendations(issues)
        }

        # Generate charts
        charts = self.generate_charts(issues, report_data)

        report_data['charts'] = charts

        return report_data

    def categorize_issues(self, issues) -> Dict[str, Any]:
        """Categorize issues by type"""
        categories = {
            'bug': [],
            'feature': [],
            'enhancement': [],
            'documentation': [],
            'question': [],
            'ui': [],
            'backend': [],
            'mobile': [],
            'performance': [],
            'other': []
        }

        for issue in issues:
            content = f"{issue.title} {issue.body}".lower()

            # Determine category based on content and labels
            issue_labels = [label.name.lower() for label in issue.labels]
            all_text = content + ' ' + ' '.join(issue_labels)

            if any(keyword in all_text for keyword in ['bug', 'error', 'crash', 'broken']):
                categories['bug'].append(issue)
            elif any(keyword in all_text for keyword in ['feature', 'implement', 'add', 'new']):
                categories['feature'].append(issue)
            elif any(keyword in all_text for keyword in ['enhancement', 'improve', 'optimize', 'better']):
                categories['enhancement'].append(issue)
            elif any(keyword in all_text for keyword in ['docs', 'documentation', 'readme', 'guide']):
                categories['documentation'].append(issue)
            elif any(keyword in all_text for keyword in ['question', 'help', 'how to', 'support']):
                categories['question'].append(issue)
            elif any(keyword in all_text for keyword in ['ui', 'ux', 'interface', 'design', 'screen']):
                categories['ui'].append(issue)
            elif any(keyword in all_text for keyword in ['api', 'server', 'backend', 'database']):
                categories['backend'].append(issue)
            elif any(keyword in all_text for keyword in ['mobile', 'ios', 'android']):
                categories['mobile'].append(issue)
            elif any(keyword in all_text for keyword in ['performance', 'slow', 'optimize', 'speed']):
                categories['performance'].append(issue)
            else:
                categories['other'].append(issue)

        return categories

    def analyze_severity(self, issues) -> Dict[str, int]:
        """Analyze issue severity distribution"""
        severity_counts = {
            'critical': 0,
            'high': 0,
            'medium': 0,
            'low': 0
        }

        for issue in issues:
            content = f"{issue.title} {issue.body}".lower()
            labels = [label.name.lower() for label in issue.labels]

            # Determine severity
            if any(keyword in content for keyword in ['critical', 'urgent', 'blocker']) or 'critical' in labels:
                severity_counts['critical'] += 1
            elif any(keyword in content for keyword in ['high', 'important']) or 'high' in labels:
                severity_counts['high'] += 1
            elif any(keyword in content for keyword in ['medium', 'normal']) or 'medium' in labels:
                severity_counts['medium'] += 1
            else:
                severity_counts['low'] += 1

        return severity_counts

    def analyze_timeline(self, issues) -> Dict[str, Any]:
        """Analyze issue resolution timeline"""
        timeline_data = {
            'created_by_day': {},
            'closed_by_day': {},
            'resolution_times': [],
            'average_resolution_time': 0,
            'median_resolution_time': 0
        }

        resolution_times = []

        for issue in issues:
            # Creation date
            created_date = issue.created_at.date().isoformat()
            timeline_data['created_by_day'][created_date] = timeline_data['created_by_day'].get(created_date, 0) + 1

            # If closed, calculate resolution time
            if issue.state == 'closed' and issue.closed_at:
                resolution_time = (issue.closed_at - issue.created_at).days
                resolution_times.append(resolution_time)

                closed_date = issue.closed_at.date().isoformat()
                timeline_data['closed_by_day'][closed_date] = timeline_data['closed_by_day'].get(closed_date, 0) + 1

        # Calculate statistics
        if resolution_times:
            timeline_data['resolution_times'] = resolution_times
            timeline_data['average_resolution_time'] = sum(resolution_times) / len(resolution_times)
            timeline_data['median_resolution_time'] = sorted(resolution_times)[len(resolution_times) // 2]

        return timeline_data

    def analyze_engagement(self, issues) -> Dict[str, Any]:
        """Analyze user engagement with issues"""
        engagement_data = {
            'total_reactions': 0,
            'most_reacted_issues': [],
            'top_contributors': {},
            'reaction_types': {
                'thumbs_up': 0,
                'thumbs_down': 0,
                'laugh': 0,
                'heart': 0,
                'hooray': 0,
                'rocket': 0,
                'eyes': 0
            },
            'comment_stats': {
                'total_comments': 0,
                'avg_comments_per_issue': 0,
                'most_commented_issues': []
            }
        }

        issue_reactions = []
        issue_comments = []
        contributor_counts = {}

        for issue in issues:
            # Reactions
            total_reactions = issue.reactions.total_count
            engagement_data['total_reactions'] += total_reactions
            issue_reactions.append((issue.number, issue.title, total_reactions))

            # Reaction types
            for reaction_type in ['thumbs_up', 'thumbs_down', 'laugh', 'heart', 'hooray', 'rocket', 'eyes']:
                count = getattr(issue.reactions, f'get_{reaction_type}', lambda: 0)()
                engagement_data['reaction_types'][reaction_type] += count

            # Comments
            comments = issue.comments
            engagement_data['comment_stats']['total_comments'] += comments
            issue_comments.append((issue.number, issue.title, comments))

            # Contributors
            for comment in issue.get_comments():
                author = comment.user.login if comment.user else 'unknown'
                contributor_counts[author] = contributor_counts.get(author, 0) + 1

        # Sort and limit top items
        engagement_data['most_reacted_issues'] = sorted(issue_reactions, key=lambda x: x[2], reverse=True)[:10]
        engagement_data['comment_stats']['most_commented_issues'] = sorted(issue_comments, key=lambda x: x[2], reverse=True)[:10]
        engagement_data['comment_stats']['avg_comments_per_issue'] = engagement_data['comment_stats']['total_comments'] / len(issues)
        engagement_data['top_contributors'] = dict(sorted(contributor_counts.items(), key=lambda x: x[1], reverse=True)[:10])

        return engagement_data

    def analyze_team_performance(self, issues) -> Dict[str, Any]:
        """Analyze team performance metrics"""
        performance_data = {
            'resolution_rate': 0,
            'avg_time_to_first_response': 0,
            'resolution_by_assignee': {},
            'assignee_workload': {},
            'quality_metrics': {}
        }

        # Calculate resolution rate
        closed_issues = [i for i in issues if i.state == 'closed']
        performance_data['resolution_rate'] = (len(closed_issues) / len(issues)) * 100

        # Analyze by assignee
        assignee_data = {}
        for issue in issues:
            assignees = [assignee.login for assignee in issue.assignees]
            for assignee in assignees:
                if assignee not in assignee_data:
                    assignee_data[assignee] = {'total': 0, 'closed': 0, 'resolution_times': []}

                assignee_data[assignee]['total'] += 1

                if issue.state == 'closed':
                    assignee_data[assignee]['closed'] += 1
                    if issue.closed_at:
                        resolution_time = (issue.closed_at - issue.created_at).days
                        assignee_data[assignee]['resolution_times'].append(resolution_time)

        # Calculate assignee metrics
        for assignee, data in assignee_data.items():
            closed_rate = (data['closed'] / data['total']) * 100 if data['total'] > 0 else 0
            avg_resolution_time = sum(data['resolution_times']) / len(data['resolution_times']) if data['resolution_times'] else 0

            performance_data['resolution_by_assignee'][assignee] = {
                'total': data['total'],
                'closed': data['closed'],
                'closed_rate': closed_rate,
                'avg_resolution_time': avg_resolution_time
            }

        # Team workload distribution
        performance_data['assignee_workload'] = {
            assignee: data['total'] for assignee, data in assignee_data.items()
        }

        return performance_data

    def identify_patterns(self, issues) -> Dict[str, List]:
        """Identify patterns and trends in issues"""
        patterns = {
            'common_keywords': {},
            'frequent_reporters': {},
            'recurring_issues': [],
            'trending_topics': []
        }

        # Common keywords
        all_text = []
        for issue in issues:
            text = f"{issue.title} {issue.body}".lower()
            all_text.extend(text.split())

        # Count keywords
        keyword_counts = {}
        for word in all_text:
            if len(word) > 3 and word not in ['the', 'and', 'for', 'with', 'have', 'this', 'that', 'from']:
                keyword_counts[word] = keyword_counts.get(word, 0) + 1

        patterns['common_keywords'] = dict(sorted(keyword_counts.items(), key=lambda x: x[1], reverse=True)[:20])

        # Frequent reporters
        reporter_counts = {}
        for issue in issues:
            reporter = issue.user.login
            reporter_counts[reporter] = reporter_counts.get(reporter, 0) + 1

        patterns['frequent_reporters'] = dict(sorted(reporter_counts.items(), key=lambda x: x[1], reverse=True)[:10])

        # Recurring issues (similar titles)
        titles = [issue.title.lower() for issue in issues]
        title_counts = {}
        for title in titles:
            title_counts[title] = title_counts.get(title, 0) + 1

        patterns['recurring_issues'] = [(title, count) for title, count in title_counts.items() if count > 1]

        return patterns

    def generate_recommendations(self, issues) -> List[str]:
        """Generate actionable recommendations based on issue analysis"""
        recommendations = []

        open_issues = [i for i in issues if i.state == 'open']
        closed_issues = [i for i in issues if i.state == 'closed']

        # General recommendations
        if len(open_issues) > len(closed_issues):
            recommendations.append("📈 Consider prioritizing backlog reduction - more issues are being created than resolved")

        if len(issues) > 0:
            resolution_rate = (len(closed_issues) / len(issues)) * 100
            if resolution_rate < 70:
                recommendations.append("⚠️ Resolution rate is below 70% - review development process and resource allocation")

        # Severity recommendations
        critical_issues = [i for i in issues if any(label.name.lower() == 'critical' for label in i.labels)]
        if critical_issues:
            recommendations.append(f"🚨 {len(critical_issues)} critical issues need immediate attention")

        # Engagement recommendations
        total_reactions = sum(issue.reactions.total_count for issue in issues)
        if total_reactions > 0:
            avg_reactions = total_reactions / len(issues)
            if avg_reactions < 2:
                recommendations.append("💡 Consider improving issue communication to increase user engagement")

        # Team performance recommendations
        assignees = {}
        for issue in issues:
            for assignee in issue.assignees:
                assignees[assignee.login] = assignees.get(assignee.login, 0) + 1

        if len(assignees) == 0:
            recommendations.append("👥 Consider assigning issues to team members for better accountability")

        return recommendations

    def generate_charts(self, issues, report_data) -> Dict[str, str]:
        """Generate charts for the report"""
        charts = {}

        try:
            # Issue Status Pie Chart
            plt.figure(figsize=(10, 6))
            labels = ['Open', 'Closed']
            sizes = [report_data['open_issues'], report_data['closed_issues']]
            colors = ['#ff6b6b', '#4ecdc4']

            plt.pie(sizes, labels=labels, colors=colors, autopct='%1.1f%%', startangle=90)
            plt.title('STEEB Issues - Open vs Closed')

            pie_chart_path = 'issue_status_pie.png'
            plt.savefig(pie_chart_path, dpi=300, bbox_inches='tight')
            plt.close()
            charts['status_pie'] = pie_chart_path

            # Categories Bar Chart
            categories = report_data['categories']
            category_counts = {k: len(v) for k, v in categories.items() if v}

            plt.figure(figsize=(12, 6))
            plt.bar(category_counts.keys(), category_counts.values(), color='skyblue')
            plt.title('STEEB Issues - Categories')
            plt.xticks(rotation=45)
            plt.ylabel('Number of Issues')
            plt.tight_layout()

            category_chart_path = 'issue_categories_bar.png'
            plt.savefig(category_chart_path, dpi=300, bbox_inches='tight')
            plt.close()
            charts['categories_bar'] = category_chart_path

            # Timeline Chart
            if report_data['timeline']['resolution_times']:
                plt.figure(figsize=(12, 6))
                plt.hist(report_data['timeline']['resolution_times'], bins=20, color='lightgreen', edgecolor='black')
                plt.title('STEEB Issues - Resolution Time Distribution')
                plt.xlabel('Days to Resolution')
                plt.ylabel('Number of Issues')
                plt.tight_layout()

                timeline_chart_path = 'resolution_timeline.png'
                plt.savefig(timeline_chart_path, dpi=300, bbox_inches='tight')
                plt.close()
                charts['timeline_histogram'] = timeline_chart_path

        except Exception as e:
            print(f"⚠️ Could not generate charts: {e}")

        return charts

    def save_report(self, report_data: Dict[str, Any], output_path: str):
        """Save the report to files"""
        output_dir = Path(output_path)
        output_dir.mkdir(parents=True, exist_ok=True)

        # Save JSON report
        json_path = output_dir / f"steeb_issues_report_{report_data['period']}.json"
        with open(json_path, 'w') as f:
            json.dump(report_data, f, indent=2)

        # Save Markdown report
        markdown_path = output_dir / f"steeb_issues_report_{report_data['period']}.md"
        self.save_markdown_report(report_data, markdown_path)

        # Save charts
        for chart_name, chart_path in report_data.get('charts', {}).items():
            if Path(chart_path).exists():
                # Move chart to output directory
                final_chart_path = output_dir / Path(chart_path).name
                Path(chart_path).rename(final_chart_path)

        print(f"✅ Report saved to {output_dir}")

    def save_markdown_report(self, report_data: Dict[str, Any], output_path: Path):
        """Save report as Markdown"""
        categories = report_data['categories']
        severity = report_data['severity_distribution']
        engagement = report_data['engagement']
        patterns = report_data['patterns']
        recommendations = report_data['recommendations']

        markdown_content = f"""
# STEEB Issues Report - {report_data['period'].title()}

## 📊 Executive Summary

- **Total Issues:** {report_data['total_issues']}
- **Open Issues:** {report_data['open_issues']}
- **Closed Issues:** {report_data['closed_issues']}
- **Resolution Rate:** {report_data['closed_issues']/report_data['total_issues']*100:.1f}%
- **Period:** {report_data['start_date'][:10]} to {report_data['end_date'][:10]}

## 🏷️ Issue Categories

| Category | Count | Percentage |
|-----------|-------|----------|
{self.generate_category_table(categories)}

## 🔥 Severity Distribution

| Severity | Count | Percentage |
|----------|-------|----------|
{self.generate_severity_table(severity)}

## ⚡ Resolution Timeline

- **Average Resolution Time:** {report_data['timeline']['average_resolution_time']:.1f} days
- **Median Resolution Time:** {report_data['timeline']['median_resolution_time']:.1f} days
- **Total Resolutions:** {len(report_data['timeline']['resolution_times'])}

## 💬 Community Engagement

- **Total Reactions:** {engagement['total_reactions']}
- **Total Comments:** {engagement['comment_stats']['total_comments']}
- **Average Comments per Issue:** {engagement['comment_stats']['avg_comments_per_issue']:.1f}

### Top Contributors
{self.generate_contributors_table(engagement['top_contributors'])}

### Most Reacted Issues
{self.generate_reacted_table(engagement['most_reacted_issues'])}

## 🔍 Issue Patterns

### Common Keywords
{self.generate_keywords_table(patterns['common_keywords'])}

### Frequent Reporters
{self.generate_reporters_table(patterns['frequent_reporters'])}

{self.generate_recurring_section(patterns['recurring_issues'])}

## 💡 Recommendations

{self.generate_recommendations_list(recommendations)}

---

*Report generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*
        """.strip()

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(markdown_content)

    def generate_category_table(self, categories):
        table = []
        for category, issues in categories.items():
            if issues:
                percentage = (len(issues) / sum(len(issues) for issues in categories.values())) * 100
                table.append(f"| {category.title()} | {len(issues)} | {percentage:.1f}% |")
        return '\n'.join(table)

    def generate_severity_table(self, severity):
        total = sum(severity.values())
        table = []
        for level, count in severity.items():
            percentage = (count / total * 100) if total > 0 else 0
            table.append(f"| {level.title()} | {count} | {percentage:.1f}% |")
        return '\n'.join(table)

    def generate_contributors_table(self, contributors):
        table = []
        for contributor, count in list(contributors.items())[:10]:
            table.append(f"| {contributor} | {count} comments |")
        return '\n'.join(table)

    def generate_reacted_table(self, reacted_issues):
        table = []
        for issue_num, title, reactions in reacted_issues[:10]:
            table.append(f"| #{issue_num} {title[:30]} | {reactions} |")
        return '\n'.join(table)

    def generate_keywords_table(self, keywords):
        table = []
        for keyword, count in list(keywords.items())[:15]:
            table.append(f"| {keyword} | {count} |")
        return '\n'.join(table)

    def generate_reporters_table(self, reporters):
        table = []
        for reporter, count in list(reporters.items())[:10]:
            table.append(f"| {reporter} | {count} issues |")
        return '\n'.join(table)

    def generate_recurring_section(self, recurring_issues):
        if not recurring_issues:
            return "No recurring issues detected."

        section = "### Recurring Issues\n\n"
        for title, count in recurring_issues[:10]:
            section += f"- **{title}** ({count} occurrences)\n"

        return section

    def generate_recommendations_list(self, recommendations):
        if not recommendations:
            return "No specific recommendations at this time."

        list_content = "\n".join(f"- {rec}" for rec in recommendations)
        return list_content

def main():
    parser = argparse.ArgumentParser(description='Generate STEEB issues report')
    parser.add_argument('--token', '-t', required=True, help='GitHub access token')
    parser.add_argument('--period', '-p', choices=['daily', 'weekly', 'monthly'], default='monthly', help='Report period')
    parser.add_argument('--repo', '-r', default='santi-billy1/stebe', help='Repository name')
    parser.add_argument('--output', '-o', required=True, help='Output directory for report')
    parser.add_argument('--charts', '-c', action='store_true', help='Generate charts')

    args = parser.parse_args()

    try:
        # Initialize reporter
        reporter = STEEBIssueReporter(args.token, args.repo)

        # Generate report
        print(f"🔄 Generating {args.period} report for {args.repo}...")
        report_data = reporter.generate_report(args.period)

        if not report_data:
            print("ℹ️  No report data generated")
            return

        # Save report
        reporter.save_report(report_data, args.output)

        print(f"✅ Report completed successfully!")
        print(f"📁 Output: {args.output}")

    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()