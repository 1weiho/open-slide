export function isMutation(method: string) {
  return !['GET', 'HEAD', 'OPTIONS'].includes(method);
}

export function validContentPath(value: string, roots: string[]) {
  return (
    roots.includes(value.split('/')[0]) &&
    !value.includes('\\') &&
    !value.includes('\0') &&
    value.split('/').every((part) => part !== '' && part !== '.' && part !== '..')
  );
}

export class SerialQueue {
  private pending: Promise<unknown> = Promise.resolve();

  run<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.pending.then(operation);
    this.pending = result.catch(() => {});
    return result;
  }
}
