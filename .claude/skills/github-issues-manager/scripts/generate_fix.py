#!/usr/bin/env python3
"""
STEEB Automated Fix Generator
Generates code fixes for common GitHub issues automatically
"""

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional

try:
    from github import Github
    from github.GithubException import GithubException
except ImportError as e:
    print(f"❌ Missing required packages: {e}")
    print("Install with: pip install PyGithub")
    sys.exit(1)

class STEEBFixGenerator:
    def __init__(self, token: str, repo_path: str):
        """Initialize the STEEB Fix Generator"""
        self.repo_path = Path(repo_path)
        self.github = None  # Will initialize when needed

        # STEEB-specific fix patterns
        self.fix_patterns = {
            'task_toggle_issue': {
                'keywords': ['toggle', 'task', 'complete', 'incomplete', 'update', 'state'],
                'files_to_check': [
                    'src/store/useTaskStore.ts',
                    'src/components/SteebChatAI.tsx',
                    'src/components/TaskList.tsx'
                ],
                'fix_template': 'task_toggle_fix'
            },
            'firebase_sync_issue': {
                'keywords': ['firebase', 'sync', 'offline', 'connection', 'permission'],
                'files_to_check': [
                    'src/lib/firebase.ts',
                    'src/services/firestoreTaskService.ts',
                    'src/store/useTaskStore.ts'
                ],
                'fix_template': 'firebase_sync_fix'
            },
            'ui_component_issue': {
                'keywords': ['ui', 'component', 'render', 'display', 'layout', 'style'],
                'files_to_check': [
                    'src/components/',
                    'src/styles/',
                    'src/assets/'
                ],
                'fix_template': 'ui_component_fix'
            },
            'navigation_issue': {
                'keywords': ['navigation', 'router', 'screen', 'page', 'route'],
                'files_to_check': [
                    'src/navigation/',
                    'src/screens/',
                    'src/App.tsx'
                ],
                'fix_template': 'navigation_fix'
            },
            'authentication_issue': {
                'keywords': ['auth', 'login', 'signin', 'signup', 'permission'],
                'files_to_check': [
                    'src/hooks/useAuth.ts',
                    'src/components/AuthScreen.tsx',
                    'src/lib/firebase.ts'
                ],
                'fix_template': 'auth_fix'
            }
        }

    def analyze_issue(self, issue_number: int, token: str) -> Dict[str, Any]:
        """Analyze a GitHub issue and determine fix type"""
        try:
            if not self.github:
                self.github = Github(token)

            # Get repository (assuming STEEB repo)
            repo = self.github.get_repo('santi-billy1/stebe')
            issue = repo.get_issue(issue_number)

            # Analyze issue content
            content = f"{issue.title} {issue.body}".lower()

            # Determine issue type
            issue_type = self.classify_issue(content)

            # Get affected files
            affected_files = self.get_affected_files(content, issue_type)

            # Generate fix strategy
            fix_strategy = self.generate_fix_strategy(issue_type, content, affected_files)

            return {
                'issue_number': issue_number,
                'title': issue.title,
                'body': issue.body,
                'author': issue.user.login,
                'labels': [label.name for label in issue.labels],
                'issue_type': issue_type,
                'affected_files': affected_files,
                'fix_strategy': fix_strategy,
                'estimated_effort': self.estimate_effort(issue_type, fix_strategy),
                'test_cases': self.generate_test_cases(issue_type, content)
            }

        except Exception as e:
            print(f"❌ Error analyzing issue: {e}")
            return {}

    def classify_issue(self, content: str) -> str:
        """Classify the issue type based on content"""
        issue_types = {}

        for issue_type, pattern in self.fix_patterns.items():
            score = 0
            for keyword in pattern['keywords']:
                if keyword in content:
                    score += 1

            # Bonus points for multiple keywords
            if content.count('error') > 1:
                score += 1
            if content.count('bug') > 1:
                score += 1

            issue_types[issue_type] = score

        # Return the issue type with highest score
        if issue_types:
            return max(issue_types, key=issue_types.get)

        return 'general_issue'

    def get_affected_files(self, content: str, issue_type: str) -> List[str]:
        """Get list of files likely affected by the issue"""
        if issue_type in self.fix_patterns:
            pattern = self.fix_patterns[issue_type]

            # Check for specific file mentions in content
            mentioned_files = []
            file_patterns = re.findall(r'([a-zA-Z0-9_\-/]+\.(ts|tsx|js|jsx|css|json))', content)
            mentioned_files.extend(file_patterns)

            # Combine with pattern files
            all_files = set(pattern['files_to_check'] + mentioned_files)

            # Filter files that exist in repo
            existing_files = []
            for file_path in all_files:
                full_path = self.repo_path / file_path
                if full_path.exists() or any(full_path.glob(pattern) for pattern in ['*.ts', '*.tsx', '*.js', '*.jsx']):
                    existing_files.append(file_path)

            return existing_files

        return []

    def generate_fix_strategy(self, issue_type: str, content: str, affected_files: List[str]) -> Dict[str, Any]:
        """Generate a fix strategy for the issue"""
        strategy = {
            'type': issue_type,
            'approach': 'manual',
            'files_to_modify': affected_files,
            'test_required': True,
            'deployment_needed': False
        }

        if issue_type == 'task_toggle_issue':
            strategy.update({
                'approach': 'state_management_fix',
                'description': 'Fix task state management and synchronization',
                'common_causes': [
                    'Race conditions in state updates',
                    'Missing optimistic updates',
                    'Firebase sync errors',
                    'Component re-rendering issues'
                ]
            })

        elif issue_type == 'firebase_sync_issue':
            strategy.update({
                'approach': 'offline_first_fix',
                'description': 'Implement robust offline-first synchronization',
                'common_causes': [
                    'Permission errors',
                    'Network connectivity issues',
                    'Authentication problems',
                    'Data consistency issues'
                ]
            })

        elif issue_type == 'ui_component_issue':
            strategy.update({
                'approach': 'component_debugging',
                'description': 'Fix UI component rendering and styling',
                'common_causes': [
                    'CSS conflicts',
                    'Component state issues',
                    'Responsive design problems',
                    'Cross-browser compatibility'
                ]
            })

        elif issue_type == 'navigation_issue':
            strategy.update({
                'approach': 'router_fix',
                'description': 'Fix navigation and routing issues',
                'common_causes': [
                    'Router configuration problems',
                    'Screen component issues',
                    'State management in navigation',
                    'Deep linking problems'
                ]
            })

        elif issue_type == 'authentication_issue':
            strategy.update({
                'approach': 'auth_flow_fix',
                'description': 'Fix authentication and authorization flow',
                'common_causes': [
                    'Firebase configuration issues',
                    'Token management problems',
                    'State persistence issues',
                    'Permission checking errors'
                ]
            })

        return strategy

    def estimate_effort(self, issue_type: str, fix_strategy: Dict[str, Any]) -> str:
        """Estimate development effort for the fix"""
        effort_matrix = {
            'task_toggle_issue': 'medium',
            'firebase_sync_issue': 'high',
            'ui_component_issue': 'low',
            'navigation_issue': 'medium',
            'authentication_issue': 'high',
            'general_issue': 'medium'
        }

        base_effort = effort_matrix.get(issue_type, 'medium')

        # Adjust based on number of affected files
        file_count = len(fix_strategy.get('files_to_modify', []))
        if file_count > 5:
            return 'high'
        elif file_count > 10:
            return 'critical'
        elif file_count < 2:
            return 'low'

        return base_effort

    def generate_test_cases(self, issue_type: str, content: str) -> List[Dict[str, str]]:
        """Generate test cases for the fix"""
        test_cases = []

        if issue_type == 'task_toggle_issue':
            test_cases.extend([
                {
                    'name': 'Task Toggle Test',
                    'description': 'Test task completion and uncompletion',
                    'steps': [
                        'Create a new task',
                        'Toggle task to complete',
                        'Verify task state updates correctly',
                        'Toggle task back to incomplete',
                        'Verify task state reverts correctly'
                    ]
                },
                {
                    'name': 'Offline Toggle Test',
                    'description': 'Test task toggling in offline mode',
                    'steps': [
                        'Disable network connection',
                        'Create and toggle tasks offline',
                        'Verify local state updates',
                        'Reconnect network',
                        'Verify synchronization'
                    ]
                }
            ])

        elif issue_type == 'firebase_sync_issue':
            test_cases.extend([
                {
                    'name': 'Firebase Sync Test',
                    'description': 'Test Firebase synchronization',
                    'steps': [
                        'Create tasks with Firebase enabled',
                        'Verify sync to Firestore',
                        'Test conflict resolution',
                        'Verify offline sync on reconnection'
                    ]
                }
            ])

        elif issue_type == 'ui_component_issue':
            test_cases.extend([
                {
                    'name': 'Component Rendering Test',
                    'description': 'Test component renders correctly',
                    'steps': [
                        'Render component in different states',
                        'Test responsive behavior',
                        'Verify styling consistency',
                        'Test accessibility features'
                    ]
                }
            ])

        return test_cases

    def generate_fix_code(self, fix_strategy: Dict[str, Any]) -> Dict[str, str]:
        """Generate fix code for the given strategy"""
        fixes = {}

        issue_type = fix_strategy.get('type', 'general_issue')
        affected_files = fix_strategy.get('files_to_modify', [])

        if issue_type == 'task_toggle_issue':
            fixes.update({
                'useTaskStore.ts': self.generate_task_store_fix(),
                'SteebChatAI.tsx': self.generate_chat_ai_fix(),
                'TaskList.tsx': self.generate_task_list_fix()
            })

        elif issue_type == 'firebase_sync_issue':
            fixes.update({
                'useTaskStore.ts': self.generate_firebase_sync_fix(),
                'firebaseErrorHandler.ts': self.generate_error_handler_fix()
            })

        elif issue_type == 'ui_component_issue':
            fixes.update({
                'component.css': self.generate_css_fix(),
                'component.tsx': self.generate_component_fix()
            })

        elif issue_type == 'navigation_issue':
            fixes.update({
                'App.tsx': self.generate_navigation_fix(),
                'navigation/types.ts': self.generate_navigation_types_fix()
            })

        elif issue_type == 'authentication_issue':
            fixes.update({
                'useAuth.ts': self.generate_auth_fix(),
                'AuthScreen.tsx': self.generate_auth_screen_fix()
            })

        return fixes

    def generate_task_store_fix(self) -> str:
        """Generate fix for task store issues"""
        return '''
// STEEB Task Store Fix
// Fixes for task state management and synchronization issues

export const useTaskStore = create<TaskStore>((set, get) => ({
  // Enhanced toggleTask with better error handling
  toggleTask: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) {
      console.error('❌ Task not found:', id);
      throw new Error('Task not found');
    }

    const willComplete = !task.completed;
    const previousState = { ...task };

    try {
      // Optimistic update first
      set(state => ({
        tasks: state.tasks.map(t =>
          t.id === id
            ? {
                ...t,
                completed: willComplete,
                status: willComplete ? 'completed' : 'pending',
                completedDate: willComplete ? new Date().toISOString() : t.completedDate,
                updatedAt: new Date().toISOString()
              }
            : t
        )
      }));

      // Calculate stats after update
      get().calculateStats();

      // Sync with Firebase if available
      const userId = auth.currentUser?.uid;
      if (userId) {
        try {
          await FirestoreTaskService.updateTask(id, {
            completed: willComplete,
            status: willComplete ? 'completed' : 'pending',
            completedDate: willComplete ? new Date().toISOString() : undefined
          });
          console.log('✅ Sync successful');
        } catch (error) {
          console.warn('⚠️ Sync failed, local changes kept:', error);
        }
      }

    } catch (error) {
      // Revert on critical error
      console.error('❌ Critical error, reverting:', error);
      set(state => ({
        tasks: state.tasks.map(t => t.id === id ? previousState : t)
      }));
      get().calculateStats();
      throw error;
    }
  },

  // Enhanced deleteTask with confirmation
  deleteTask: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) {
      console.error('❌ Task not found for deletion:', id);
      throw new Error('Task not found');
    }

    try {
      // Remove from local state immediately
      set(state => ({
        tasks: state.tasks.filter(t => t.id !== id)
      }));

      get().calculateStats();

      // Sync with Firebase if available
      const userId = auth.currentUser?.uid;
      if (userId) {
        try {
          await FirestoreTaskService.deleteTask(id, userId);
          console.log('✅ Task deleted from Firebase');
        } catch (error) {
          console.warn('⚠️ Firebase delete failed, local deletion kept:', error);
        }
      }

    } catch (error) {
      console.error('❌ Error deleting task:', error);
      throw error;
    }
  }
}));
        '''.strip()

    def generate_chat_ai_fix(self) -> str:
        """Generate fix for SteebChatAI component issues"""
        return '''
// STEEB Chat AI Fix
// Enhanced button handling with loading states and error recovery

const TaskActions = ({ task, onToggle, onDelete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleToggle = async () => {
    if (isProcessing || !task) return;

    setIsProcessing(true);
    setError(null);

    try {
      await onToggle(task.id);

      // Visual feedback
      buttonRef.current?.classList.add('bg-green-500');
      setTimeout(() => {
        buttonRef.current?.classList.remove('bg-green-500');
      }, 300);

    } catch (error) {
      console.error('❌ Toggle error:', error);
      setError('No se pudo completar la tarea');

      // Visual error feedback
      buttonRef.current?.classList.add('bg-red-500');
      setTimeout(() => {
        buttonRef.current?.classList.remove('bg-red-500');
      }, 2000);

    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (isProcessing || !task) return;

    const confirmMessage = `¿Estás seguro de eliminar "${task.title}"?`;
    if (!window.confirm(confirmMessage)) return;

    setIsProcessing(true);
    setError(null);

    try {
      await onDelete(task.id);
      console.log('✅ Task deleted successfully');

    } catch (error) {
      console.error('❌ Delete error:', error);
      setError('No se pudo eliminar la tarea');
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleToggle}
        disabled={isProcessing}
        className={`w-5 h-5 rounded-full border-2 border-black transition-all duration-200 ${
          isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'
        }`}
        ref={buttonRef}
      >
        {task.completed && <Check className="w-3 h-3 text-black mx-auto" />}
      </button>

      <button
        onClick={handleDelete}
        disabled={isProcessing}
        className={`w-5 h-5 rounded-full bg-red-100 hover:bg-red-200 transition-all duration-200 flex items-center justify-center ${
          isProcessing ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <Trash2 className="w-3 h-3 text-red-600" />
      </button>

      {error && (
        <div className="text-red-500 text-xs ml-2">
          {error}
        </div>
      )}
    </div>
  );
};
        '''.strip()

    def generate_firebase_sync_fix(self) -> str:
        """Generate fix for Firebase synchronization issues"""
        return '''
// STEEB Firebase Sync Fix
// Enhanced error handling and offline-first synchronization

export const FirebaseSyncManager = {
  // Enhanced sync with retry mechanism
  syncTask: async (task: Task, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          throw new Error('User not authenticated');
        }

        const response = await fetch(`/api/tasks/${task.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userId}`
          },
          body: JSON.stringify({
            completed: task.completed,
            status: task.status,
            completedDate: task.completedDate,
            updatedAt: new Date().toISOString()
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Sync successful:', result);
        return result;

      } catch (error) {
        console.warn(`⚠️ Sync attempt ${attempt} failed:`, error);

        if (attempt === maxRetries) {
          console.error('❌ All sync attempts failed');
          throw error;
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  },

  // Batch sync for multiple tasks
  syncMultipleTasks: async (tasks: Task[]) => {
    const results = [];
    const errors = [];

    for (const task of tasks) {
      try {
        const result = await this.syncTask(task);
        results.push({ task, result, success: true });
      } catch (error) {
        errors.push({ task, error, success: false });
      }
    }

    return {
      synced: results,
      failed: errors,
      summary: {
        total: tasks.length,
        successful: results.length,
        failed: errors.length
      }
    };
  }
};

// Enhanced error handler
export const handleFirebaseError = (error: any) => {
  if (error.code === 'permission-denied') {
    console.warn('⚠️ Permission denied, using offline mode');
    return 'offline';
  } else if (error.code === 'unavailable') {
    console.warn('⚠️ Firebase unavailable, using offline mode');
    return 'offline';
  } else if (error.message?.includes('network')) {
    console.warn('⚠️ Network error, retrying later');
    return 'retry';
  }

  console.error('❌ Unexpected Firebase error:', error);
  return 'unknown';
};
        '''.strip()

    def generate_auth_fix(self) -> str:
        """Generate fix for authentication issues"""
        return '''
// STEEB Authentication Fix
// Enhanced authentication flow with better error handling

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Enhanced login with better error handling
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!auth) {
        throw new Error('Firebase not initialized');
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      if (!firebaseUser) {
        throw new Error('No user returned from Firebase');
      }

      // Get user data from Firestore
      const userData = await getUserData(firebaseUser.uid);

      const mappedUser: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: userData?.name || '',
        nickname: userData?.nickname || '',
        avatar: firebaseUser.photoURL || userData?.avatar,
        provider: 'email',
        createdAt: new Date().toISOString(),
        emailVerified: firebaseUser.emailVerified || false
      };

      setUser(mappedUser);

      // Set up real-time listeners
      await setupRealtimeListeners(firebaseUser.uid);

      return mappedUser;

    } catch (error: any) {
      console.error('❌ Login error:', error);

      // Enhanced error messages
      if (error.code === 'auth/user-not-found') {
        setError('Usuario no encontrado. Verificá el email.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Contraseña incorrecta. Intentá nuevamente.');
      } else if (error.code === 'auth/user-disabled') {
        setError('Cuenta deshabilitada. Contactá soporte.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Demasiados intentos. Esperá unos minutos.');
      } else {
        setError('Error al iniciar sesión. Intentá nuevamente.');
      }

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced logout
  const logout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }

      // Clean up listeners
      cleanupRealtimeListeners();

      setUser(null);
      setError(null);

      console.log('✅ User logged out successfully');

    } catch (error) {
      console.error('❌ Logout error:', error);
      throw error;
    }
  };

  return {
    user,
    isLoading,
    error,
    login,
    logout,
    // ... other auth methods
  };
};
        '''.strip()

    def create_pull_request(self, fix_data: Dict[str, Any], issue_number: int) -> Optional[str]:
        """Create a pull request for the generated fix"""
        try:
            # Create feature branch
            branch_name = f"fix-issue-{issue_number}-{datetime.now().strftime('%Y%m%d')}"

            # This would integrate with Git operations
            # For now, return the PR template

            pr_template = f"""
## 🔧 Fix for Issue #{issue_number}

### 📋 Problem Summary
{fix_data.get('description', 'No description provided')}

### 🎯 Solution
This PR addresses the reported issue by implementing the following fixes:

### 📁 Files Modified
{chr(10).join(f"- {file}" for file in fix_data.get('files_to_modify', []))}

### 🧪 Testing
- [ ] Manual testing completed
- [ ] Automated tests pass
- [ ] Cross-platform testing
- [ ] Performance testing

### 📋 Checklist
- [ ] Code follows STEEB conventions
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes

### 🔗 Related Issues
Closes #{issue_number}

---

🤖 *This PR was generated automatically by STEEB Issues Manager*
            """.strip()

            return pr_template

        except Exception as e:
            print(f"❌ Error creating PR template: {e}")
            return None

    def save_fix_to_file(self, fix_data: Dict[str, Any], output_dir: str):
        """Save the generated fix to files"""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        # Save fix data as JSON
        fix_json = output_path / f"fix_issue_{fix_data['issue_number']}.json"
        with open(fix_json, 'w') as f:
            json.dump(fix_data, f, indent=2)

        # Save code fixes
        fixes = fix_data.get('fix_code', {})
        for filename, code in fixes.items():
            file_path = output_path / filename
            file_path.parent.mkdir(parents=True, exist_ok=True)

            with open(file_path, 'w') as f:
                f.write(code)

        # Save PR template
        pr_template = self.create_pull_request(fix_data, fix_data['issue_number'])
        if pr_template:
            pr_file = output_path / f"pr_template_{fix_data['issue_number']}.md"
            with open(pr_file, 'w') as f:
                f.write(pr_template)

        print(f"✅ Fix saved to {output_path}")

def main():
    parser = argparse.ArgumentParser(description='Generate automated fixes for STEEB issues')
    parser.add_argument('--token', '-t', required=True, help='GitHub access token')
    parser.add_argument('--issue', '-i', type=int, required=True, help='Issue number to analyze')
    parser.add_argument('--repo-path', '-r', default='.', help='Path to STEEB repository')
    parser.add_argument('--output', '-o', required=True, help='Output directory for fixes')
    parser.add_argument('--create-pr', '-p', action='store_true', help='Create pull request template')
    parser.add_argument('--auto-fix', '-a', action='store_true', help='Automatically apply fixes')

    args = parser.parse_args()

    try:
        # Initialize fix generator
        generator = STEEBFixGenerator(args.token, args.repo_path)

        # Analyze the issue
        print(f"🔍 Analyzing Issue #{args.issue}...")
        fix_data = generator.analyze_issue(args.issue, args.token)

        if not fix_data:
            print("❌ Could not analyze issue")
            sys.exit(1)

        # Display analysis results
        print(f"✅ Issue Analysis Complete")
        print(f"   Type: {fix_data['issue_type']}")
        print(f"   Severity: {fix_data.get('severity', 'unknown')}")
        print(f"   Effort: {fix_data['estimated_effort']}")
        print(f"   Files: {', '.join(fix_data['affected_files'])}")
        print()

        # Generate fix code
        print("🔧 Generating fix code...")
        fix_code = generator.generate_fix_code(fix_data['fix_strategy'])
        fix_data['fix_code'] = fix_code

        # Save fix to files
        generator.save_fix_to_file(fix_data, args.output)

        # Create PR template if requested
        if args.create_pr:
            pr_template = generator.create_pull_request(fix_data, args.issue)
            if pr_template:
                pr_file = Path(args.output) / f"pr_template_{args.issue}.md"
                with open(pr_file, 'w') as f:
                    f.write(pr_template)
                print(f"✅ PR template created")

        print(f"\n🎯 Fix generated successfully!")
        print(f"📁 Output directory: {args.output}")
        print(f"🔍 Review the generated code before applying")

        if args.auto_fix:
            print(f"⚠️  Auto-fix not implemented yet. Please review and apply manually.")

    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()