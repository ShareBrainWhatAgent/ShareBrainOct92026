// Utility functions for handling AI model display names

export function getDisplayModelName(model: string): string {
  if (model.includes('meta-llama') || model.includes('Llama')) {
    return 'Llama 3.1 70B';
  }
  
  switch (model) {
    case 'gpt-4o':
      return 'Llama 3.1 70B';
    case 'gpt-3.5-turbo':
      return 'Llama 3.1 70B';
    case 'Llama 3.1 405B':
      return 'Llama 3.1 70B';
    case 'Llama 3.1 70B':
      return 'Llama 3.1 70B';
    case 'Llama 3.1 8B':
      return 'Llama 3.1 70B';
    default:
      return 'Llama 3.1 70B';
  }
}

export function isLlamaModel(model: string): boolean {
  return model.includes('meta-llama') || model.includes('Llama');
}