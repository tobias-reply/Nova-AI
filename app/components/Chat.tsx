import { useState } from 'react';

export default function Chat() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/bedrock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      setResponse(data.response);
    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message || 'Failed to generate response');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt here..."
          rows={4}
          className="prompt-input"
          required
        />
        <button type="submit" disabled={isLoading || !prompt.trim()} className="submit-button">
          {isLoading ? 'Generating...' : 'Generate Response'}
        </button>
      </form>
      
      {error && (
        <div className="error-container" style={{ color: 'red', marginTop: '1rem' }}>
          Error: {error}
        </div>
      )}
      
      {response && (
        <div className="response-container">
          <h3>Response:</h3>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
}
