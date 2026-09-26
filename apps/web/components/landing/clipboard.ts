export async function writeToClipboard(content: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(content);
      return true;
    } catch {
      return copyWithExecCommand(content);
    }
  }

  return copyWithExecCommand(content);
}

function copyWithExecCommand(content: string): boolean {
  const textArea = document.createElement('textarea');
  textArea.value = content;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.append(textArea);
  textArea.select();
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    textArea.remove();
  }
}
