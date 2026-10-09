import { Octokit } from "@octokit/rest";

if (!process.env.GITHUB_TOKEN) {
  throw new Error("GITHUB_TOKEN environment variable is required for Git integration");
}

if (!process.env.GITHUB_ORG) {
  throw new Error("GITHUB_ORG environment variable is required for Git integration");
}

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const GITHUB_ORG = process.env.GITHUB_ORG;

export interface GitCommit {
  message: string;
  author: {
    name: string;
    email: string;
  };
  files: {
    path: string;
    content: string;
  }[];
}

export class GitService {
  /**
   * Create a private repository for an agent
   */
  async createAgentRepository(agentId: number, agentName: string): Promise<string> {
    const repoName = `agent-${agentId}-${agentName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    
    try {
      const { data: repo } = await octokit.repos.createInOrg({
        org: GITHUB_ORG,
        name: repoName,
        description: `ShareBrain Agent: ${agentName}`,
        private: true,
        auto_init: true,
        gitignore_template: "Node",
        license_template: "mit",
      });

      // Create initial agent structure
      await this.createInitialAgentFiles(repoName, agentId, agentName);

      return repo.html_url;
    } catch (error) {
      console.error("Error creating agent repository:", error);
      throw new Error(`Failed to create repository for agent ${agentId}`);
    }
  }

  /**
   * Create initial agent file structure
   */
  private async createInitialAgentFiles(repoName: string, agentId: number, agentName: string): Promise<void> {
    const files = [
      {
        path: "README.md",
        content: `# ${agentName}

ShareBrain Agent #${agentId}

## Description
This is a ShareBrain AI agent created through the Agent Builder platform.

## Version History
- Initial version created via ShareBrain Agent Builder
- All changes tracked automatically through ShareBrain platform

## Usage
This agent is deployed and managed through the ShareBrain platform.
Visit https://sharebrain.me to interact with this agent.

## Technical Details
- Agent ID: ${agentId}
- Platform: ShareBrain
- Version Control: Automated via ShareBrain Git Service
`,
      },
      {
        path: "agent.json",
        content: JSON.stringify({
          agentId: agentId,
          name: agentName,
          version: "1.0.0",
          platform: "ShareBrain",
          createdAt: new Date().toISOString(),
          description: "ShareBrain AI Agent",
        }, null, 2),
      },
      {
        path: "code/index.js",
        content: `// ShareBrain Agent Code
// Agent ID: ${agentId}
// Agent Name: ${agentName}

// This file contains the custom JavaScript code for this agent
// All changes are automatically versioned through ShareBrain's Git service

// Initial agent code will be added here when developer saves their work
console.log("ShareBrain Agent ${agentName} initialized");
`,
      },
    ];

    for (const file of files) {
      await octokit.repos.createOrUpdateFileContents({
        owner: GITHUB_ORG,
        repo: repoName,
        path: file.path,
        message: `Initial commit: Create ${file.path}`,
        content: Buffer.from(file.content).toString("base64"),
      });
    }
  }

  /**
   * Commit agent workspace changes to Git
   */
  async commitAgentChanges(
    agentId: number,
    agentName: string,
    workspace: any,
    developerName: string,
    developerEmail: string,
    commitMessage: string
  ): Promise<string> {
    const repoName = `agent-${agentId}-${agentName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    
    try {
      // Update agent.json with latest workspace info
      const agentConfig = {
        agentId: agentId,
        name: agentName,
        version: workspace.version || "1.0.0",
        platform: "ShareBrain",
        lastModified: new Date().toISOString(),
        description: workspace.description || "ShareBrain AI Agent",
        systemPrompt: workspace.systemPrompt,
        model: workspace.model,
        parameters: workspace.parameters,
      };

      // Commit the agent configuration
      await octokit.repos.createOrUpdateFileContents({
        owner: GITHUB_ORG,
        repo: repoName,
        path: "agent.json",
        message: `${commitMessage} - Update agent configuration`,
        content: Buffer.from(JSON.stringify(agentConfig, null, 2)).toString("base64"),
        author: {
          name: developerName,
          email: developerEmail,
        },
      });

      // Commit the JavaScript code
      if (workspace.code) {
        await octokit.repos.createOrUpdateFileContents({
          owner: GITHUB_ORG,
          repo: repoName,
          path: "code/index.js",
          message: `${commitMessage} - Update agent code`,
          content: Buffer.from(workspace.code).toString("base64"),
          author: {
            name: developerName,
            email: developerEmail,
          },
        });
      }

      // Commit the system prompt
      if (workspace.systemPrompt) {
        await octokit.repos.createOrUpdateFileContents({
          owner: GITHUB_ORG,
          repo: repoName,
          path: "prompts/system.txt",
          message: `${commitMessage} - Update system prompt`,
          content: Buffer.from(workspace.systemPrompt).toString("base64"),
          author: {
            name: developerName,
            email: developerEmail,
          },
        });
      }

      return `https://github.com/${GITHUB_ORG}/${repoName}`;
    } catch (error) {
      console.error("Error committing agent changes:", error);
      throw new Error(`Failed to commit changes for agent ${agentId}`);
    }
  }

  /**
   * Create a release tag when agent is deployed
   */
  async createAgentRelease(
    agentId: number,
    agentName: string,
    version: string,
    releaseNotes: string
  ): Promise<string> {
    const repoName = `agent-${agentId}-${agentName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    
    try {
      const { data: release } = await octokit.repos.createRelease({
        owner: GITHUB_ORG,
        repo: repoName,
        tag_name: `v${version}`,
        name: `Release ${version}`,
        body: releaseNotes,
        draft: false,
        prerelease: false,
      });

      return release.html_url;
    } catch (error) {
      console.error("Error creating agent release:", error);
      throw new Error(`Failed to create release for agent ${agentId}`);
    }
  }

  /**
   * Get commit history for an agent
   */
  async getAgentCommitHistory(agentId: number, agentName: string): Promise<any[]> {
    const repoName = `agent-${agentId}-${agentName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    
    try {
      const { data: commits } = await octokit.repos.listCommits({
        owner: GITHUB_ORG,
        repo: repoName,
        per_page: 50,
      });

      return commits.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author,
        date: commit.commit.author?.date,
        url: commit.html_url,
      }));
    } catch (error) {
      console.error("Error fetching commit history:", error);
      return [];
    }
  }

  /**
   * Check if repository exists for an agent
   */
  async repositoryExists(agentId: number, agentName: string): Promise<boolean> {
    const repoName = `agent-${agentId}-${agentName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    
    try {
      await octokit.repos.get({
        owner: GITHUB_ORG,
        repo: repoName,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get repository URL for an agent
   */
  getRepositoryUrl(agentId: number, agentName: string): string {
    const repoName = `agent-${agentId}-${agentName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    return `https://github.com/${GITHUB_ORG}/${repoName}`;
  }
}

export const gitService = new GitService();