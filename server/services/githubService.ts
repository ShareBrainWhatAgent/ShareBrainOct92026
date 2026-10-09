import { Octokit } from "@octokit/rest";
import simpleGit from "simple-git";
import { storage } from "../storage";
import path from "path";
import fs from "fs/promises";

export interface GitHubRepository {
  name: string;
  full_name: string;
  html_url: string;
  clone_url: string;
  ssh_url: string;
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string;
  email: string;
}

export class GitHubService {
  private octokit: Octokit;
  private organizationName: string;

  constructor(accessToken: string) {
    this.octokit = new Octokit({
      auth: accessToken,
    });
    this.organizationName = process.env.GITHUB_ORGANIZATION || "ShareBrain-Developer-Agents";
  }

  /**
   * Get authenticated GitHub user information
   */
  async getAuthenticatedUser(): Promise<GitHubUser> {
    const { data } = await this.octokit.rest.users.getAuthenticated();
    return {
      login: data.login,
      id: data.id,
      avatar_url: data.avatar_url,
      html_url: data.html_url,
      name: data.name || data.login,
      email: data.email || ""
    };
  }

  /**
   * Create a new repository for a developer
   */
  async createDeveloperRepository(
    developerUsername: string,
    workspaceId: string,
    description?: string
  ): Promise<GitHubRepository> {
    const repoName = `sharebrain-agent-${developerUsername}-${workspaceId}`;
    
    try {
      // Create repository in our organization
      const { data } = await this.octokit.rest.repos.createInOrg({
        org: this.organizationName,
        name: repoName,
        description: description || `ShareBrain AI Agent developed by ${developerUsername}`,
        private: false, // Make it public for collaboration
        auto_init: true,
        gitignore_template: "Node",
        license_template: "mit"
      });

      return {
        name: data.name,
        full_name: data.full_name,
        html_url: data.html_url,
        clone_url: data.clone_url,
        ssh_url: data.ssh_url
      };
    } catch (error) {
      console.error("Error creating repository:", error);
      throw new Error(`Failed to create repository: ${error.message}`);
    }
  }

  /**
   * Add a collaborator to a repository
   */
  async addCollaborator(repoName: string, username: string): Promise<void> {
    try {
      await this.octokit.rest.repos.addCollaborator({
        owner: this.organizationName,
        repo: repoName,
        username: username,
        permission: "push" // Give push access
      });
    } catch (error) {
      console.error("Error adding collaborator:", error);
      throw new Error(`Failed to add collaborator: ${error.message}`);
    }
  }

  /**
   * Create initial agent template files in the repository
   */
  async createInitialFiles(
    repoName: string,
    workspaceData: {
      name: string;
      description: string;
      code: string;
      systemPrompt: string;
      memoryType: string;
    }
  ): Promise<void> {
    try {
      // Create agent.js file
      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.organizationName,
        repo: repoName,
        path: "agent.js",
        message: "Initial agent code",
        content: Buffer.from(workspaceData.code).toString('base64'),
      });

      // Create system-prompt.md file
      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.organizationName,
        repo: repoName,
        path: "system-prompt.md",
        message: "Initial system prompt",
        content: Buffer.from(workspaceData.systemPrompt).toString('base64'),
      });

      // Create config.json file
      const config = {
        name: workspaceData.name,
        description: workspaceData.description,
        memoryType: workspaceData.memoryType,
        version: "1.0.0",
        lastUpdated: new Date().toISOString()
      };

      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.organizationName,
        repo: repoName,
        path: "config.json",
        message: "Initial configuration",
        content: Buffer.from(JSON.stringify(config, null, 2)).toString('base64'),
      });

      // Create README.md file
      const readme = `# ${workspaceData.name}

${workspaceData.description}

## Agent Configuration

- **Memory Type**: ${workspaceData.memoryType}
- **Platform**: ShareBrain AI Agent Platform
- **Developer**: Agent Builder

## Files

- \`agent.js\` - Main agent logic and behavior
- \`system-prompt.md\` - System prompt and instructions
- \`config.json\` - Agent configuration settings

## Development

This agent is developed using the ShareBrain Agent Builder platform. 
You can use GitHub Codex or any IDE to modify the agent code, then sync with the ShareBrain platform.

## Deployment

Deploy this agent through the ShareBrain Agent Builder interface or API.
`;

      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.organizationName,
        repo: repoName,
        path: "README.md",
        message: "Initial README",
        content: Buffer.from(readme).toString('base64'),
      });

    } catch (error) {
      console.error("Error creating initial files:", error);
      throw new Error(`Failed to create initial files: ${error.message}`);
    }
  }

  /**
   * Update files in the repository
   */
  async updateRepositoryFiles(
    repoName: string,
    files: Array<{
      path: string;
      content: string;
      message: string;
    }>
  ): Promise<void> {
    try {
      for (const file of files) {
        // Get current file to get its SHA (required for updates)
        let sha: string | undefined;
        try {
          const { data } = await this.octokit.rest.repos.getContent({
            owner: this.organizationName,
            repo: repoName,
            path: file.path,
          });
          if ('sha' in data) {
            sha = data.sha;
          }
        } catch (error) {
          // File doesn't exist, will be created
        }

        await this.octokit.rest.repos.createOrUpdateFileContents({
          owner: this.organizationName,
          repo: repoName,
          path: file.path,
          message: file.message,
          content: Buffer.from(file.content).toString('base64'),
          sha: sha,
        });
      }
    } catch (error) {
      console.error("Error updating repository files:", error);
      throw new Error(`Failed to update repository files: ${error.message}`);
    }
  }

  /**
   * Get repository contents
   */
  async getRepositoryContents(repoName: string, path: string = ""): Promise<any> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.organizationName,
        repo: repoName,
        path: path,
      });
      return data;
    } catch (error) {
      console.error("Error getting repository contents:", error);
      throw new Error(`Failed to get repository contents: ${error.message}`);
    }
  }

  /**
   * Get file content from repository
   */
  async getFileContent(repoName: string, filePath: string): Promise<string> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.organizationName,
        repo: repoName,
        path: filePath,
      });

      if ('content' in data) {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
      throw new Error("File content not found");
    } catch (error) {
      console.error("Error getting file content:", error);
      throw new Error(`Failed to get file content: ${error.message}`);
    }
  }

  /**
   * Commit changes with a descriptive message
   */
  async commitChanges(
    repoName: string,
    files: Array<{
      path: string;
      content: string;
    }>,
    commitMessage: string
  ): Promise<string> {
    try {
      // Get the latest commit SHA
      const { data: ref } = await this.octokit.rest.git.getRef({
        owner: this.organizationName,
        repo: repoName,
        ref: "heads/main",
      });

      const latestCommitSha = ref.object.sha;

      // Get the commit tree
      const { data: commit } = await this.octokit.rest.git.getCommit({
        owner: this.organizationName,
        repo: repoName,
        commit_sha: latestCommitSha,
      });

      // Create blobs for each file
      const blobs = await Promise.all(
        files.map(async (file) => {
          const { data: blob } = await this.octokit.rest.git.createBlob({
            owner: this.organizationName,
            repo: repoName,
            content: Buffer.from(file.content).toString('base64'),
            encoding: 'base64',
          });
          return { path: file.path, sha: blob.sha };
        })
      );

      // Create new tree
      const { data: tree } = await this.octokit.rest.git.createTree({
        owner: this.organizationName,
        repo: repoName,
        base_tree: commit.tree.sha,
        tree: blobs.map(blob => ({
          path: blob.path,
          mode: '100644',
          type: 'blob',
          sha: blob.sha,
        })),
      });

      // Create new commit
      const { data: newCommit } = await this.octokit.rest.git.createCommit({
        owner: this.organizationName,
        repo: repoName,
        message: commitMessage,
        tree: tree.sha,
        parents: [latestCommitSha],
      });

      // Update the reference
      await this.octokit.rest.git.updateRef({
        owner: this.organizationName,
        repo: repoName,
        ref: "heads/main",
        sha: newCommit.sha,
      });

      return newCommit.sha;
    } catch (error) {
      console.error("Error committing changes:", error);
      throw new Error(`Failed to commit changes: ${error.message}`);
    }
  }

  /**
   * Push workspace changes to GitHub repository
   */
  async pushWorkspaceToGitHub(workspaceData: any): Promise<void> {
    try {
      const repoName = workspaceData.githubRepoName;
      if (!repoName) {
        throw new Error("No GitHub repository connected to this workspace");
      }

      // Update config.json with latest workspace data
      const config = {
        name: workspaceData.name,
        description: workspaceData.description,
        memoryType: workspaceData.memoryType,
        status: workspaceData.status,
        version: "1.0.0",
        lastUpdated: new Date().toISOString()
      };

      const filesToUpdate = [
        {
          path: "agent.js",
          content: workspaceData.code,
          message: "Update agent code"
        },
        {
          path: "system-prompt.md",
          content: workspaceData.systemPrompt,
          message: "Update system prompt"
        },
        {
          path: "config.json",
          content: JSON.stringify(config, null, 2),
          message: "Update configuration"
        }
      ];

      await this.updateRepositoryFiles(repoName, filesToUpdate);
    } catch (error) {
      console.error("Error pushing workspace to GitHub:", error);
      throw new Error(`Failed to push workspace to GitHub: ${error.message}`);
    }
  }

  /**
   * Pull changes from GitHub repository to workspace
   */
  async pullFromGitHubToWorkspace(repoName: string): Promise<{
    code: string;
    systemPrompt: string;
    config: any;
  }> {
    try {
      // Get current files from repository
      const [codeContent, systemPromptContent, configContent] = await Promise.all([
        this.getFileContent(repoName, "agent.js").catch(() => ""),
        this.getFileContent(repoName, "system-prompt.md").catch(() => ""),
        this.getFileContent(repoName, "config.json").catch(() => "{}")
      ]);

      let config = {};
      try {
        config = JSON.parse(configContent);
      } catch (error) {
        console.warn("Could not parse config.json from repository");
      }

      return {
        code: codeContent,
        systemPrompt: systemPromptContent,
        config
      };
    } catch (error) {
      console.error("Error pulling from GitHub to workspace:", error);
      throw new Error(`Failed to pull from GitHub to workspace: ${error.message}`);
    }
  }

  /**
   * Get repository commit history
   */
  async getRepositoryCommits(repoName: string, limit: number = 10): Promise<any[]> {
    try {
      const { data } = await this.octokit.rest.repos.listCommits({
        owner: this.organizationName,
        repo: repoName,
        per_page: limit,
      });
      return data;
    } catch (error) {
      console.error("Error getting repository commits:", error);
      throw new Error(`Failed to get repository commits: ${error.message}`);
    }
  }

  /**
   * Check if repository has changes since last sync
   */
  async checkForChanges(repoName: string, lastSyncDate?: Date): Promise<boolean> {
    try {
      const commits = await this.getRepositoryCommits(repoName, 1);
      if (commits.length === 0) return false;

      const lastCommitDate = new Date(commits[0].commit.committer.date);
      return !lastSyncDate || lastCommitDate > lastSyncDate;
    } catch (error) {
      console.error("Error checking for changes:", error);
      return false;
    }
  }
}

/**
 * Create a GitHub service instance with a user's access token
 */
export async function createGitHubService(userId: string): Promise<GitHubService> {
  const user = await storage.getUser(userId);
  if (!user?.githubAccessToken) {
    throw new Error("User has not connected their GitHub account");
  }
  return new GitHubService(user.githubAccessToken);
}

/**
 * Create a GitHub service instance with app-level access token
 */
export function createAppGitHubService(): GitHubService {
  const appToken = process.env.GITHUB_TOKEN_DEV || process.env.GITHUB_APP_TOKEN || process.env.GITHUB_TOKEN;
  if (!appToken) {
    throw new Error("GitHub app token not configured");
  }
  return new GitHubService(appToken);
}