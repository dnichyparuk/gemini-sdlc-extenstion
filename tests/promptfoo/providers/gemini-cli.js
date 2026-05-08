const { execFile } = require('child_process');

class GeminiCliProvider {
  id() {
    return 'gemini-cli';
  }

  async callApi(prompt, context) {
    return new Promise((resolve) => {
      // Unset GEMINI_SESSION_ID so gemini doesn't refuse to run inside another Gemini session if applicable
      const env = { ...process.env };
      
      const proc = execFile('gemini', ['-p', '--output-format', 'text', '--input-format', 'text'], {
        timeout: 300_000,
        maxBuffer: 20 * 1024 * 1024,
        env,
      }, (error, stdout, stderr) => {
        if (error) {
          return resolve({ error: error.message, output: stderr });
        }
        resolve({ output: stdout });
      });
      proc.stdin.write(prompt);
      proc.stdin.end();
    });
  }
}

module.exports = GeminiCliProvider;
