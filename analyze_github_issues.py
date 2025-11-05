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
    """Analyze STEEB issues from GitHub API with authentication"""

    # GitHub API for private repository with authentication
    url = "https://api.github.com/repos/Hiizzzo/stebe/issues"
    pulls_url = "https://api.github.com/repos/Hiizzzo/stebe/pulls"
    headers = {
        "Authorization": "token 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",
        "Accept": "application/vnd.github.v3+json"
    }

    try:
        print("[STEEB] Analizando issues y Pull Requests de STEEB desde GitHub...")

        # Get all issues (with authentication allows 5000 per hour)
        all_issues = []
        all_pulls = []
        page = 1
        per_page = 100

        # First, get actual issues
        while True:
            params = {
                'state': 'all',
                'per_page': per_page,
                'page': page,
                'sort': 'created',
                'direction': 'desc'
            }

            response = requests.get(url, params=params, headers=headers, timeout=30)
            response.raise_for_status()

            issues = response.json()
            if not issues:
                break

            # Filter out pull requests, keep only issues
            actual_issues = [issue for issue in issues if 'pull_request' not in issue]

            if actual_issues:
                all_issues.extend(actual_issues)
                print(f"[STEEB] Issues - Pagina {page}: {len(actual_issues)} issues (filtrados de {len(issues)} total)")

            page += 1

            # Evitar rate limiting y detener si no hay más resultados
            if len(issues) < per_page:
                break

        # Then, get pull requests (they often represent issues/feature requests)
        page = 1
        while True:
            params = {
                'state': 'all',
                'per_page': per_page,
                'page': page,
                'sort': 'created',
                'direction': 'desc'
            }

            response = requests.get(pulls_url, params=params, headers=headers, timeout=30)
            response.raise_for_status()

            pulls = response.json()
            if not pulls:
                break

            all_pulls.extend(pulls)
            print(f"[STEEB] Pull Requests - Pagina {page}: {len(pulls)} PRs")
            page += 1

            # Evitar rate limiting y detener si no hay más resultados
            if len(pulls) < per_page:
                break

        # Combine issues and pulls for analysis
        all_items = all_issues + all_pulls
        print(f"[STEEB] Total encontrados: {len(all_issues)} issues + {len(all_pulls)} Pull Requests = {len(all_items)} items")

        if not all_items:
            return {
                'total_issues': 0,
                'open_issues': 0,
                'closed_issues': 0,
                'pull_requests': 0,
                'error': 'No issues or pull requests found'
            }

        # Analyze issues and pull requests
        open_items = [item for item in all_items if item['state'] == 'open']
        closed_items = [item for item in all_items if item['state'] == 'closed']
        pull_requests_count = len(all_pulls)

        # Extract data
        analysis = {
            'total_issues': len(all_issues),
            'pull_requests': pull_requests_count,
            'total_items': len(all_items),
            'open_issues': len(open_items),
            'closed_issues': len(closed_items),
            'resolution_rate': (len(closed_items) / len(all_items)) * 100,
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

        # Process each item (issue or pull request)
        for item in all_items:
            # Labels
            for label in item.get('labels', []):
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
            title_lower = item.get('title', '').lower()
            body_content = item.get('body', '')
            body_lower = body_content.lower() if body_content else ''
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
            for assignee in item.get('assignees', []):
                assignee_name = assignee['login']
                analysis['assignees'][assignee_name] = analysis['assignees'].get(assignee_name, 0) + 1

            # Author
            author = item.get('user', {}).get('login', 'unknown')
            analysis['authors'][author] = analysis['authors'].get(author, 0) + 1

            # Reactions
            reactions = item.get('reactions', {})
            total_reactions = reactions.get('total_count', 0)
            analysis['reactions']['total'] = analysis['reactions'].get('total', 0) + total_reactions

            # Timeline (created/closed dates)
            if item.get('created_at'):
                try:
                    created_date = datetime.fromisoformat(item['created_at'].replace('Z', '+00:00')).date()
                    analysis['issues_by_year'][created_date.year] = analysis['issues_by_year'].get(created_date.year, 0) + 1

                    if item['state'] == 'closed' and item.get('closed_at'):
                        closed_date = datetime.fromisoformat(item['closed_at'].replace('Z', '+00:00')).date()
                        resolution_days = (closed_date - created_date).days
                        analysis['recent_activity'].append({
                            'type': 'closed',
                            'issue_number': item['number'],
                            'title': (item.get('title', '')[:50] + '...') if len(item.get('title', '')) > 50 else item.get('title', ''),
                            'days_to_resolve': resolution_days,
                            'date': closed_date.isoformat()
                        })
                    else:
                        days_open = (datetime.now().date() - created_date).days
                        analysis['recent_activity'].append({
                            'type': 'open',
                            'issue_number': item['number'],
                            'title': (item.get('title', '')[:50] + '...') if len(item.get('title', '')) > 50 else item.get('title', ''),
                            'days_open': days_open,
                            'date': created_date.isoformat()
                        })
                except (ValueError, AttributeError) as e:
                    print(f"[WARNING] Error procesando fechas del item #{item.get('number', 'unknown')}: {e}")
                    continue

        # Sort recent activity
        analysis['recent_activity'].sort(key=lambda x: x['date'], reverse=True)

        # Generate summary
        top_items = []
        for item in all_items[:10]:  # Top 10 most recent
            item_type = 'PR' if 'pull_request' in item else 'Issue'
            top_items.append({
                'number': item['number'],
                'title': item['title'],
                'state': item['state'],
                'type': item_type,
                'created_at': item['created_at'],
                'labels': [label['name'] for label in item.get('labels', [])],
                'author': item.get('user', {}).get('login'),
                'reactions': item.get('reactions', {}).get('total_count', 0),
                'comments': item.get('comments', 0)
            })

        analysis['issues_summary'] = top_items

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
    print(f"   • Pull Requests: {analysis.get('pull_requests', 0)}")
    print(f"   • Total de Items: {analysis.get('total_items', 0)}")
    print(f"   • Items Abiertos: {analysis['open_issues']}")
    print(f"   • Items Cerrados: {analysis['closed_issues']}")
    print(f"   • Tasa de Resolucion: {analysis['resolution_rate']:.1f}%")

    print(f"\n[CATEGORIAS] Categorias:")
    total_items = analysis.get('total_items', 1)
    for category, count in sorted(analysis['categories'].items(), key=lambda x: x[1], reverse=True):
        percentage = (count / total_items) * 100 if total_items > 0 else 0
        print(f"   • {category.title()}: {count} ({percentage:.1f}%)")

    print(f"\n[SEVERIDAD] Severidad:")
    for level, count in analysis['severity'].items():
        if count > 0:
            percentage = (count / total_items) * 100 if total_items > 0 else 0
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
    for i, item in enumerate(analysis['issues_summary'][:5]):
        status_marker = "[ABIERTO]" if item['state'] == 'open' else "[CERRADO]"
        type_marker = f"[{item['type']}]" if 'type' in item else "[ITEM]"
        print(f"   {status_marker} {type_marker} #{item['number']}: {item['title']}")
        print(f"      Autor: {item['author']} • Reacciones: {item['reactions']} • Comentarios: {item['comments']}")

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