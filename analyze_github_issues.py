#!/usr/bin/env python3
"""
STEEB GitHub Issues Analyzer
Analyzes STEEB repository issues for current status and recommendations
"""

import requests
import json
from datetime import datetime
from typing import Dict, List, Any

def analyze_steeb_issues() -> Dict[str, Any]:
    """Analyze STEEB issues from GitHub API (public access)"""

    # GitHub API for public issues
    url = "https://api.github.com/repos/Hiizzzo/stebe/issues"

    try:
        print("[STEEB] Analizando issues de STEEB desde GitHub...")

        # Get all issues (GitHub API allows 30 per request without authentication)
        all_issues = []
        page = 1
        per_page = 100

        while True:
            params = {
                'state': 'all',
                'per_page': per_page,
                'page': page,
                'sort': 'created',
                'direction': 'desc'
            }

            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()

            issues = response.json()
            if not issues:
                break

            all_issues.extend(issues)
            print(f"[STEEB] Pagina {page}: {len(issues)} issues")
            page += 1

            # Evitar rate limiting
            if len(issues) < per_page:
                break

        if not all_issues:
            return {
                'total_issues': 0,
                'open_issues': 0,
                'closed_issues': 0,
                'error': 'No issues found or repository not accessible'
            }

        # Analyze issues
        open_issues = [issue for issue in all_issues if issue['state'] == 'open']
        closed_issues = [issue for issue in all_issues if issue['state'] == 'closed']

        # Extract data
        analysis = {
            'total_issues': len(all_issues),
            'open_issues': len(open_issues),
            'closed_issues': len(closed_issues),
            'resolution_rate': (len(closed_issues) / len(all_issues)) * 100,
            'labels': {},
            'assignees': {},
            'authors': {},
            'reactions': {},
            'recent_activity': [],
            'categories': {},
            'severity': {
                'critical': 0,
                'high': 0,
                'medium': 0,
                'low': 0
            },
            'issues_by_year': {},
            'issues_summary': []
        }

        # Process each issue
        for issue in all_issues:
            # Labels
            for label in issue.get('labels', []):
                label_name = label['name']
                analysis['labels'][label_name] = analysis['labels'].get(label_name, 0) + 1

                # Severity analysis
                if any(keyword in label_name.lower() for keyword in ['critical', 'urgent', 'blocker']):
                    analysis['severity']['critical'] += 1
                elif any(keyword in label_name.lower() for keyword in ['high', 'important']):
                    analysis['severity']['high'] += 1
                elif any(keyword in label_name.lower() for keyword in ['medium', 'normal']):
                    analysis['severity']['medium'] += 1
                else:
                    analysis['severity']['low'] += 1

            # Categories
            title_lower = issue['title'].lower()
            body_lower = issue.get('body', '').lower()
            content = f"{title_lower} {body_lower}"

            if any(keyword in content for keyword in ['bug', 'error', 'crash']):
                analysis['categories']['bug'] = analysis['categories'].get('bug', 0) + 1
            elif any(keyword in content for keyword in ['feature', 'enhancement', 'implement']):
                analysis['categories']['feature'] = analysis['categories'].get('feature', 0) + 1
            elif any(keyword in content for keyword in ['documentation', 'docs', 'readme']):
                analysis['categories']['documentation'] = analysis['categories'].get('documentation', 0) + 1
            elif any(keyword in content for keyword in ['ui', 'ux', 'interface']):
                analysis['categories']['ui'] = analysis['categories'].get('ui', 0) + 1
            elif any(keyword in content for keyword in ['performance', 'slow', 'optimize']):
                analysis['categories']['performance'] = analysis['categories'].get('performance', 0) + 1
            elif any(keyword in content for keyword in ['auth', 'login', 'permission']):
                analysis['categories']['authentication'] = analysis['categories'].get('authentication', 0) + 1

            # Assignees
            for assignee in issue.get('assignees', []):
                assignee_name = assignee['login']
                analysis['assignees'][assignee_name] = analysis['assignees'].get(assignee_name, 0) + 1

            # Author
            author = issue.get('user', {}).get('login', 'unknown')
            analysis['authors'][author] = analysis['authors'].get(author, 0) + 1

            # Reactions
            reactions = issue.get('reactions', {})
            total_reactions = reactions.get('total_count', 0)
            analysis['reactions']['total'] = analysis['reactions'].get('total', 0) + total_reactions

            # Timeline (created/closed dates)
            created_date = datetime.fromisoformat(issue['created_at'].replace('Z', '+00:00')).date()
            analysis['issues_by_year'][created_date.year] = analysis['issues_by_year'].get(created_date.year, 0) + 1

            if issue['state'] == 'closed' and issue['closed_at']:
                closed_date = datetime.fromisoformat(issue['closed_at'].replace('Z', '+00:00')).date()
                resolution_days = (closed_date - created_date).days
                analysis['recent_activity'].append({
                    'type': 'closed',
                    'issue_number': issue['number'],
                    'title': issue['title'][:50] + '...' if len(issue['title']) > 50 else issue['title'],
                    'days_to_resolve': resolution_days,
                    'date': closed_date.isoformat()
                })
            else:
                days_open = (datetime.now().date() - created_date).days
                analysis['recent_activity'].append({
                    'type': 'open',
                    'issue_number': issue['number'],
                    'title': issue['title'][:50] + '...' if len(issue['title']) > 50 else issue['title'],
                    'days_open': days_open,
                    'date': created_date.isoformat()
                })

        # Sort recent activity
        analysis['recent_activity'].sort(key=lambda x: x['date'], reverse=True)

        # Generate summary
        top_issues = []
        for issue in all_issues[:10]:  # Top 10 most recent
            top_issues.append({
                'number': issue['number'],
                'title': issue['title'],
                'state': issue['state'],
                'created_at': issue['created_at'],
                'labels': [label['name'] for label in issue.get('labels', [])],
                'author': issue.get('user', {}).get('login'),
                'reactions': issue.get('reactions', {}).get('total_count', 0),
                'comments': issue.get('comments', 0)
            })

        analysis['issues_summary'] = top_issues

        return analysis

    except requests.exceptions.RequestException as e:
        if e.response.status_code == 404:
            return {
                'total_issues': 0,
                'open_issues': 0,
                'closed_issues': 0,
                'error': 'Repository Hiizzzo/stebe not found or not accessible'
            }
        else:
            return {
                'total_issues': 0,
                'open_issues': 0,
                'closed_issues': 0,
                'error': f"API Error: {e}"
            }
    except Exception as e:
        return {
            'total_issues': 0,
            'open_issues': 0,
            'closed_issues': 0,
            'error': f"Error: {e}"
        }

def print_analysis_results(analysis: Dict[str, Any]):
    """Print formatted analysis results"""

    print(f"\n[STEEB] ANALISIS DE ISSUES DE STEEB")
    print("=" * 50)

    if 'error' in analysis:
        print(f"[ERROR] {analysis['error']}")
        return

    print(f"\n[RESUMEN] Resumen General:")
    print(f"   • Total de Issues: {analysis['total_issues']}")
    print(f"   • Issues Abiertos: {analysis['open_issues']}")
    print(f"   • Issues Cerrados: {analysis['closed_issues']}")
    print(f"   • Tasa de Resolucion: {analysis['resolution_rate']:.1f}%")

    print(f"\n[CATEGORIAS] Categorias:")
    for category, count in sorted(analysis['categories'].items(), key=lambda x: x[1], reverse=True):
        percentage = (count / analysis['total_issues']) * 100 if analysis['total_issues'] > 0 else 0
        print(f"   • {category.title()}: {count} ({percentage:.1f}%)")

    print(f"\n[SEVERIDAD] Severidad:")
    for level, count in analysis['severity'].items():
        if count > 0:
            percentage = (count / analysis['total_issues']) * 100 if analysis['total_issues'] > 0 else 0
            print(f"   • {level.title()}: {count} ({percentage:.1f}%)")

    print(f"\n[ASIGNADOS] Asignados:")
    for assignee, count in sorted(analysis['assignees'].items(), key=lambda x: x[1], reverse=True):
        print(f"   • {assignee}: {count} issues")

    print(f"\n[AUTORES] Autores:")
    for author, count in sorted(analysis['authors'].items(), key=lambda x: x[1], reverse=True)[:5]:
        print(f"   • {author}: {count} issues")

    if len(analysis['authors']) > 5:
        print(f"   • ... y {len(analysis['authors']) - 5} autores mas")

    print(f"\n[INTERACCION] Reacciones Totales: {analysis['reactions']['total']}")
    print(f"[INTERACCION] Comentarios Totales: {analysis['issues_summary'][0].get('comments', 0) if analysis['issues_summary'] else 0}")

    print(f"\n[CRONOLOGIA] Issues por Año:")
    for year, count in sorted(analysis['issues_by_year'].items(), reverse=True):
        print(f"   • {year}: {count} issues")

    print(f"\n[RECIENTES] Issues Recientes:")
    print("   (Ultimos 10 issues creados)")
    for i, issue in enumerate(analysis['issues_summary'][:5]):
        status_marker = "[ABIERTO]" if issue['state'] == 'open' else "[CERRADO]"
        print(f"   {status_marker} #{issue['number']}: {issue['title']}")
        print(f"      Autor: {issue['author']} • Reacciones: {issue['reactions']} • Comentarios: {issue['comments']}")

    if len(analysis['issues_summary']) > 5:
        print(f"   ... y {len(analysis['issues_summary']) - 5} issues mas")

    print(f"\n[RECOMENDACIONES] Recomendaciones para GitHub:")

    if analysis['open_issues'] > analysis['closed_issues']:
        print("   [!] Priorizar issues abiertos - hay mas pendientes que resueltos")

    if analysis['resolution_rate'] < 50:
        print(f"   [!] Mejorar tasa de resolucion - solo el {analysis['resolution_rate']:.1f}% se resuelve")

    if analysis['categories'].get('bug', 0) > analysis['categories'].get('feature', 0):
        print("   [!] Foco en feature requests - hay mas bugs que nuevas funcionalidades")

    if analysis['severity']['critical'] > 0:
        print(f"   [CRITICO] Hay {analysis['severity']['critical']} issues criticos requiriendo atencion inmediata")

    if len(analysis['assignees']) == 0:
        print("   [!] Asignar issues a miembros del equipo para mejor seguimiento")

    if analysis['reactions']['total'] == 0:
        print("   [!] Fomentar participacion de usuarios en issues con reacciones")

    print(f"\n[PROXIMOS PASOS] Proximos Pasos:")
    print("   1. Subir la skill a GitHub (hecho manualmente)")
    print("   2. Configurar GitHub token para automatizacion")
    print("   3. Iniciar monitoreo automatico de issues")
    print(f"   4. Configurar webhook en GitHub para la repo Hiizzzo/stebe")
    print("   5. Activar la skill en Claude Code con: '/skill github-issues-manager'")

if __name__ == "__main__":
    analysis = analyze_steeb_issues()
    print_analysis_results(analysis)