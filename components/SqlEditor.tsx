import React from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../contexts/ThemeContext';

// Ensure Monaco is loaded from a CDN that supports standard ES modules if needed, 
// though @monaco-editor/react's default loader usually handles this well.
// We will rely on the default configuration which pulls from jsdelivr.

interface SqlEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  readOnly?: boolean;
}

const SqlEditor: React.FC<SqlEditorProps> = ({ value, onChange, readOnly = false }) => {
  const { theme } = useTheme();
  const monacoRef = React.useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    monacoRef.current = monaco;

    // Define Dark Theme
    monaco.editor.defineTheme('nextdb-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'c084fc' }, // violet-400
        { token: 'identifier', foreground: 'e4e4e7' }, // zinc-200
        { token: 'string', foreground: '86efac' }, // green-300
        { token: 'number', foreground: '93c5fd' }, // blue-300
        { token: 'comment', foreground: '71717a' }, // zinc-500
        { token: 'delimiter', foreground: 'a1a1aa' }, // zinc-400
      ],
      colors: {
        'editor.background': '#09090b', // zinc-950
        'editor.foreground': '#e4e4e7', // zinc-200
        'editor.lineHighlightBackground': '#18181b', // zinc-900
        'editorCursor.foreground': '#a78bfa', // violet-400
        'editorIndentGuide.background': '#27272a', // zinc-800
        'editorIndentGuide.activeBackground': '#52525b', // zinc-600
        'editorLineNumber.foreground': '#52525b', // zinc-600
        'editor.selectionBackground': '#2e1065', // violet-950
        'editor.inactiveSelectionBackground': '#27272a',
      }
    });

    // Define Light Theme
    monaco.editor.defineTheme('nextdb-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '7c3aed' }, // violet-600
        { token: 'identifier', foreground: '18181b' }, // zinc-900
        { token: 'string', foreground: '16a34a' }, // green-600
        { token: 'number', foreground: '2563eb' }, // blue-600
        { token: 'comment', foreground: 'a1a1aa' }, // zinc-400
        { token: 'delimiter', foreground: '71717a' }, // zinc-500
      ],
      colors: {
        'editor.background': '#ffffff', // white
        'editor.foreground': '#18181b', // zinc-900
        'editor.lineHighlightBackground': '#f4f4f5', // zinc-100
        'editorCursor.foreground': '#7c3aed', // violet-600
        'editorIndentGuide.background': '#e4e4e7', // zinc-200
        'editorIndentGuide.activeBackground': '#a1a1aa', // zinc-400
        'editorLineNumber.foreground': '#a1a1aa', // zinc-400
        'editor.selectionBackground': '#ddd6fe', // violet-200
        'editor.inactiveSelectionBackground': '#f4f4f5',
      }
    });

    // Set initial theme
    monaco.editor.setTheme(theme === 'dark' ? 'nextdb-dark' : 'nextdb-light');
  };

  // Update theme when it changes
  React.useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(theme === 'dark' ? 'nextdb-dark' : 'nextdb-light');
    }
  }, [theme]);

  return (
    <div className="w-full h-full relative group">
      <Editor
        height="100%"
        defaultLanguage="sql"
        value={value}
        onChange={onChange}
        theme={theme === 'dark' ? 'nextdb-dark' : 'nextdb-light'}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: '"JetBrains Mono", "Menlo", "Consolas", monospace',
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
          glyphMargin: false,
          folding: true,
          lineDecorationsWidth: 10,
          lineNumbersMinChars: 3,
          renderLineHighlight: 'all',
          cursorBlinking: 'smooth',
          smoothScrolling: true,
          contextmenu: true,
        }}
        loading={
          <div className="flex items-center justify-center h-full text-theme-tertiary text-sm">
            Loading Editor...
          </div>
        }
      />
    </div>
  );
};

export default SqlEditor;