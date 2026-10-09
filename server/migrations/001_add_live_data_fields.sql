-- Add live data capabilities to agents table
-- This migration adds fields for web search and API integration capabilities

ALTER TABLE agents ADD COLUMN IF NOT EXISTS web_search_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS api_integrations TEXT[] DEFAULT '{}';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS data_refresh_interval INTEGER DEFAULT 60;

-- Create index for agents with live data capabilities
CREATE INDEX IF NOT EXISTS idx_agents_web_search_enabled ON agents(web_search_enabled) WHERE web_search_enabled = TRUE;

-- Create table for API integration configurations
CREATE TABLE IF NOT EXISTS api_integrations (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
  api_type VARCHAR(50) NOT NULL, -- 'news', 'financial', 'weather', 'social', etc.
  api_key_name VARCHAR(100) NOT NULL, -- Environment variable name for API key
  base_url VARCHAR(255), -- Base URL for API
  rate_limit_per_hour INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create table for caching live data responses
CREATE TABLE IF NOT EXISTS live_data_cache (
  id SERIAL PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  data_type VARCHAR(50) NOT NULL, -- 'news', 'financial', 'weather', etc.
  query_params JSONB,
  response_data JSONB,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for live data cache
CREATE INDEX IF NOT EXISTS idx_live_data_cache_key ON live_data_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_live_data_cache_expires ON live_data_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_live_data_cache_type ON live_data_cache(data_type);

-- Create table for tracking API usage
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
  api_type VARCHAR(50) NOT NULL,
  endpoint VARCHAR(255),
  request_params JSONB,
  response_size INTEGER,
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for API usage tracking
CREATE INDEX IF NOT EXISTS idx_api_usage_agent_id ON api_usage_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage_logs(created_at);

-- Insert some example configurations
INSERT INTO api_integrations (agent_id, api_type, api_key_name, base_url, rate_limit_per_hour)
SELECT 
  id, 
  'news', 
  'NEWS_API_KEY', 
  'https://newsapi.org/v2', 
  100
FROM agents 
WHERE name = 'News Agent'
ON CONFLICT DO NOTHING;

INSERT INTO api_integrations (agent_id, api_type, api_key_name, base_url, rate_limit_per_hour)
SELECT 
  id, 
  'financial', 
  'ALPHA_VANTAGE_API_KEY', 
  'https://www.alphavantage.co/query', 
  500
FROM agents 
WHERE name = 'Financial Market Agent'
ON CONFLICT DO NOTHING;

INSERT INTO api_integrations (agent_id, api_type, api_key_name, base_url, rate_limit_per_hour)
SELECT 
  id, 
  'weather', 
  'OPENWEATHER_API_KEY', 
  'https://api.openweathermap.org/data/2.5', 
  1000
FROM agents 
WHERE name = 'Weather Agent'
ON CONFLICT DO NOTHING;