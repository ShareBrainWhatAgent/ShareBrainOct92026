import { useQuery } from "@tanstack/react-query";

interface ChatCommandProcessorProps {
  agentId: number;
  message: string;
  onScriptCommand: (command: string, data?: any) => void;
}

interface OwnershipInfo {
  isOwner: boolean;
  canEdit: boolean;
  scriptVersion: number;
  lastModified: string;
}

interface ScriptInfo {
  script: string;
  scriptVersion: number;
  lastModified: string;
  agentName: string;
  agentDescription: string;
}

export function ChatCommandProcessor({ agentId, message, onScriptCommand }: ChatCommandProcessorProps) {
  // Check ownership for command validation
  const { data: ownership } = useQuery<OwnershipInfo>({
    queryKey: ["/api/agents", agentId, "ownership"],
    enabled: !!agentId,
  });

  // Get script info for show-script command
  const { data: scriptInfo } = useQuery<ScriptInfo>({
    queryKey: ["/api/agents", agentId, "script"],
    enabled: !!agentId && ownership?.canEdit,
  });

  // Process incoming messages for script editing commands
  const processMessage = (msg: string): string | null => {
    if (!ownership?.canEdit) {
      return null; // User can't edit this agent
    }

    const trimmedMsg = msg.trim().toLowerCase();

    // /show-script command
    if (trimmedMsg === '/show-script' || trimmedMsg === '/script') {
      if (scriptInfo) {
        const formattedScript = `**Current System Prompt** (Version ${scriptInfo.scriptVersion})

\`\`\`
${scriptInfo.script}
\`\`\`

**Agent Information:**
- Name: ${scriptInfo.agentName}
- Last Modified: ${new Date(scriptInfo.lastModified).toLocaleString()}
- Version: ${scriptInfo.scriptVersion}

**Available Commands:**
- \`/show-script\` - Display current script
- \`/copy-script\` - Copy script to clipboard  
- \`/update-script [new script]\` - Update system prompt
- \`/edit-script\` - Open script editor interface

Type \`/edit-script\` to open the visual script editor, or use \`/update-script\` followed by your new script.`;

        onScriptCommand('show-script', {
          script: scriptInfo.script,
          formattedResponse: formattedScript,
        });
        
        return formattedScript;
      } else {
        return "Loading script information...";
      }
    }

    // /copy-script command
    if (trimmedMsg === '/copy-script') {
      if (scriptInfo) {
        // Trigger copy to clipboard
        navigator.clipboard.writeText(scriptInfo.script).then(() => {
          onScriptCommand('copy-script', { script: scriptInfo.script });
        }).catch(() => {
          // Fallback if clipboard fails
          onScriptCommand('copy-script', { 
            script: scriptInfo.script,
            error: true 
          });
        });

        return `**Script Copied to Clipboard**

The current system prompt (${scriptInfo.script.length} characters) has been copied to your clipboard.

You can now:
1. Paste it into ChatGPT or Claude for improvement
2. Edit it in your preferred text editor
3. Use \`/update-script [improved script]\` to apply changes

Current version: ${scriptInfo.scriptVersion}`;
      } else {
        return "Unable to copy script - loading script information...";
      }
    }

    // /edit-script command
    if (trimmedMsg === '/edit-script' || trimmedMsg === '/editor') {
      onScriptCommand('edit-script', {});
      return `**Opening Script Editor**

The visual script editor is now open. You can:
- Edit the system prompt directly
- Preview your changes before saving
- Add a reason for the changes
- Reset to the original script

The editor provides a better experience for longer scripts and complex edits.`;
    }

    // /update-script command
    if (trimmedMsg.startsWith('/update-script ')) {
      const newScript = msg.substring('/update-script '.length).trim();
      
      if (!newScript) {
        return `**Invalid Update Command**

Usage: \`/update-script [your new script]\`

Example:
\`/update-script You are a helpful assistant that specializes in cooking.\`

The new script will replace the current system prompt. Make sure to include the complete prompt you want to use.`;
      }

      onScriptCommand('update-script', { 
        newScript,
        originalMessage: msg 
      });
      
      return `**Script Update Initiated**

Updating system prompt with your new script (${newScript.length} characters)...

Your new script:
\`\`\`
${newScript}
\`\`\`

Please confirm this update by saying "yes" or "confirm". This will replace the current system prompt.`;
    }

    // /preview-script command
    if (trimmedMsg.startsWith('/preview-script ')) {
      const newScript = msg.substring('/preview-script '.length).trim();
      
      if (!newScript) {
        return `**Invalid Preview Command**

Usage: \`/preview-script [your script to preview]\`

This will show you how the script would look without actually updating it.`;
      }

      onScriptCommand('preview-script', { 
        newScript,
        originalScript: scriptInfo?.script || ''
      });
      
      return `**Script Preview**

**Current Script (Version ${scriptInfo?.scriptVersion || 1}):**
\`\`\`
${scriptInfo?.script || 'Loading...'}
\`\`\`

**Your New Script:**
\`\`\`
${newScript}
\`\`\`

**Changes:** ${newScript.length - (scriptInfo?.script?.length || 0)} characters

Use \`/update-script ${newScript}\` to apply these changes.`;
    }

    // Help command
    if (trimmedMsg === '/help-script' || trimmedMsg === '/script-help') {
      return `**Script Editing Commands**

Available commands for editing this agent:

\`/show-script\` - Display the current system prompt
\`/copy-script\` - Copy current script to clipboard
\`/edit-script\` - Open visual script editor
\`/update-script [new script]\` - Update the system prompt
\`/preview-script [script]\` - Preview changes before applying
\`/help-script\` - Show this help message

**Example Workflow:**
1. \`/show-script\` - See current prompt
2. \`/copy-script\` - Copy to clipboard
3. Edit in ChatGPT/Claude for improvements
4. \`/update-script [improved version]\` - Apply changes

**Tips:**
- Use \`/edit-script\` for longer prompts or complex edits
- Add change reasons when updating for better tracking
- You can preview changes before applying them
- Only you (the agent creator) can edit this script`;
    }

    return null; // Not a script command
  };

  // Check if message is a script editing command
  const isScriptCommand = (msg: string): boolean => {
    const trimmedMsg = msg.trim().toLowerCase();
    return trimmedMsg.startsWith('/') && (
      trimmedMsg === '/show-script' ||
      trimmedMsg === '/script' ||
      trimmedMsg === '/copy-script' ||
      trimmedMsg === '/edit-script' ||
      trimmedMsg === '/editor' ||
      trimmedMsg.startsWith('/update-script ') ||
      trimmedMsg.startsWith('/preview-script ') ||
      trimmedMsg === '/help-script' ||
      trimmedMsg === '/script-help'
    );
  };

  // Process the message if it's a command
  if (isScriptCommand(message)) {
    return processMessage(message);
  }

  return null;
}

// Hook for using the command processor
export function useScriptCommandProcessor(agentId: number) {
  const { data: ownership } = useQuery<OwnershipInfo>({
    queryKey: ["/api/agents", agentId, "ownership"],
    enabled: !!agentId,
  });

  const processCommand = (message: string, onScriptCommand: (command: string, data?: any) => void): string | null => {
    const processor = ChatCommandProcessor({ agentId, message, onScriptCommand });
    return processor;
  };

  return {
    canEdit: ownership?.canEdit || false,
    isOwner: ownership?.isOwner || false,
    processCommand,
  };
}