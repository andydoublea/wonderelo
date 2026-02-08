/**
 * Copy text to clipboard using fallback method when Clipboard API is blocked
 */
export function copyToClipboard(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Try modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => resolve())
        .catch(() => {
          // If Clipboard API fails, use fallback
          fallbackCopyToClipboard(text, resolve, reject);
        });
    } else {
      // Use fallback if Clipboard API not available
      fallbackCopyToClipboard(text, resolve, reject);
    }
  });
}

function fallbackCopyToClipboard(
  text: string,
  resolve: () => void,
  reject: (error: Error) => void
) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';
  
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  
  try {
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    
    if (successful) {
      resolve();
    } else {
      reject(new Error('Copy command failed'));
    }
  } catch (err) {
    document.body.removeChild(textarea);
    reject(err as Error);
  }
}
