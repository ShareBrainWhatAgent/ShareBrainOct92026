/**
 * Generate clean, SEO-friendly URLs for agent websites
 */
export function generateAgentWebsiteSlug(agentName: string): string {
  return agentName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '') // Remove spaces
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .replace(/^-|-$/g, ''); // Remove leading/trailing dashes
}

/**
 * Generate full website URL for an agent
 */
export function generateAgentWebsiteUrl(agentName: string): string {
  const slug = generateAgentWebsiteSlug(agentName);
  // Use the /agent-website/ path for development, direct path for production
  return process.env.NODE_ENV === 'production' 
    ? `https://sharebrain.me/${slug}`
    : `https://sharebrain.me/agent-website/${slug}`;
}

/**
 * Generate agent profile URL for public access
 */
export function generateAgentProfileUrl(agentName: string): string {
  const slug = generateAgentWebsiteSlug(agentName);
  return `https://sharebrain.me/agent/${slug}`;
}

/**
 * Validate if a URL slug is available
 */
export function isValidSlug(slug: string): boolean {
  // Check if slug contains only alphanumeric characters and hyphens
  return /^[a-z0-9-]+$/.test(slug) && slug.length > 0 && slug.length <= 100;
}

/**
 * Reserved slugs that cannot be used for agent websites
 */
export const RESERVED_SLUGS = new Set([
  'api', 'admin', 'www', 'mail', 'ftp', 'localhost', 'dashboard',
  'agents', 'advanced-agents', 'create', 'edit', 'delete', 'login', 'logout', 'register',
  'settings', 'profile', 'help', 'about', 'contact', 'terms', 'privacy',
  'blog', 'news', 'support', 'docs', 'documentation', 'webhooks',
  'billing', 'pricing', 'features', 'download', 'uploads', 'assets',
  'static', 'public', 'private', 'secure', 'auth', 'oauth', 'sso',
  'app', 'mobile', 'desktop', 'web', 'service', 'services', 'system',
  'root', 'home', 'index', 'main', 'default', 'test', 'testing',
  'dev', 'development', 'staging', 'production', 'beta', 'alpha',
  'v1', 'v2', 'v3', 'version', 'release', 'latest', 'stable',
  'error', '404', '500', 'maintenance', 'offline', 'robots',
  'sitemap', 'feed', 'rss', 'atom', 'json', 'xml', 'txt',
  'css', 'js', 'img', 'images', 'fonts', 'videos', 'audio',
  'checkout', 'payment', 'invoice', 'receipt', 'order', 'cart',
  'user', 'users', 'account', 'accounts', 'member', 'members',
  'group', 'groups', 'team', 'teams', 'organization', 'org',
  'company', 'business', 'enterprise', 'pro', 'premium', 'plus',
  'free', 'trial', 'demo', 'sample', 'example', 'tutorial',
  'guide', 'manual', 'faq', 'questions', 'answers', 'search',
  'results', 'explore', 'discover', 'browse', 'category', 'tag',
  'share', 'social', 'facebook', 'twitter', 'linkedin', 'instagram',
  'youtube', 'github', 'discord', 'slack', 'telegram', 'whatsapp'
]);

/**
 * Check if a slug is reserved
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

/**
 * Generate a unique slug by appending numbers if needed
 */
export function generateUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  let slug = baseSlug;
  let counter = 1;
  
  while (existingSlugs.includes(slug) || isReservedSlug(slug)) {
    slug = `${baseSlug}${counter}`;
    counter++;
  }
  
  return slug;
}