import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { join } from 'node:path';

/**
 * Fonts are named by family, so a deck only renders as authored on a machine
 * that has those families. Installing per user keeps this free of administrator
 * rights.
 */

export function listInstalledFamilies(): Set<string> {
  const families = new Set<string>();
  const add = (name: string) => {
    const cleaned = name
      .replace(/\s*\((TrueType|OpenType)\)\s*$/i, '')
      // Variable files carry their axes in the name ("Lora[wght]"); the family
      // the OS reports is the bare one.
      .replace(/\[[^\]]*\]/g, '')
      .replace(/\s*&\s*/g, ' ')
      .trim();
    if (cleaned) families.add(cleaned.toLowerCase());
  };

  if (platform() === 'win32') {
    for (const hive of ['HKCU', 'HKLM']) {
      try {
        const out = execFileSync(
          'reg',
          ['query', `${hive}\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Fonts`],
          { encoding: 'utf8', timeout: 10_000 },
        );
        for (const line of out.split('\n')) {
          // "    Geist Black (TrueType)    REG_SZ    C:\path\Geist-Black.ttf"
          const match = line.match(/^\s{4}(.+?)\s{2,}REG_SZ\s{2,}/);
          if (match) add(match[1]);
        }
      } catch {
        // Hive unreadable: fall through, the file scan below still helps.
      }
    }
    for (const dir of [
      join(process.env.LOCALAPPDATA ?? '', 'Microsoft', 'Windows', 'Fonts'),
      join(process.env.WINDIR ?? 'C:\\Windows', 'Fonts'),
    ]) {
      addFromDir(dir, add);
    }
  } else if (platform() === 'darwin') {
    for (const dir of [
      join(homedir(), 'Library', 'Fonts'),
      '/Library/Fonts',
      '/System/Library/Fonts',
    ]) {
      addFromDir(dir, add);
    }
  } else {
    for (const dir of [join(homedir(), '.local', 'share', 'fonts'), '/usr/share/fonts']) {
      addFromDir(dir, add);
    }
  }

  return families;
}

/** File names are a weak signal, but they catch fonts missing from the registry. */
function addFromDir(dir: string, add: (name: string) => void): void {
  if (!dir || !existsSync(dir)) return;
  try {
    for (const file of readdirSync(dir)) {
      if (!/\.(ttf|otf|ttc)$/i.test(file)) continue;
      const base = file.replace(/\.(ttf|otf|ttc)$/i, '');
      const [family] = base.split('-');
      add(family.replace(/([a-z])([A-Z])/g, '$1 $2'));
    }
  } catch {
    // Unreadable directory is not fatal.
  }
}

export type FontInstallResult = { installed: number; failed: string[] };

export function installFontFiles(files: string[]): FontInstallResult {
  const failed: string[] = [];
  let installed = 0;

  const target =
    platform() === 'win32'
      ? join(
          process.env.LOCALAPPDATA ?? join(homedir(), 'AppData', 'Local'),
          'Microsoft',
          'Windows',
          'Fonts',
        )
      : platform() === 'darwin'
        ? join(homedir(), 'Library', 'Fonts')
        : join(homedir(), '.local', 'share', 'fonts');
  mkdirSync(target, { recursive: true });

  for (const src of files) {
    const file = src.split(/[\\/]/).pop();
    if (!file) continue;
    const dest = join(target, file);
    try {
      const upToDate = existsSync(dest) && statSync(dest).size === statSync(src).size;
      if (!upToDate) copyFileSync(src, dest);
      if (platform() === 'win32') {
        execFileSync(
          'reg',
          [
            'add',
            'HKCU\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Fonts',
            '/v',
            `${faceName(file)} (TrueType)`,
            '/t',
            'REG_SZ',
            '/d',
            dest,
            '/f',
          ],
          { stdio: 'ignore', timeout: 10_000 },
        );
      }
      installed++;
    } catch {
      failed.push(file);
    }
  }

  if (platform() === 'linux' && installed > 0) {
    try {
      execFileSync('fc-cache', ['-f'], { stdio: 'ignore', timeout: 30_000 });
    } catch {
      // Cache refresh is best-effort.
    }
  }

  return { installed, failed };
}

/**
 * "Geist-SemiBoldItalic.ttf" -> "Geist SemiBold Italic"
 *
 * Axis suffixes are dropped: a variable file named `Lora[wght].ttf` installs as
 * the family "Lora", and keeping the brackets would register a name nothing
 * matches on later.
 */
export function faceName(file: string): string {
  const base = file.replace(/\.(ttf|otf)$/i, '').replace(/\[[^\]]*\]/g, '');
  const [family, style] = base.split('-');
  const spaced = (style ?? '').replace(/([a-z])([A-Z])/g, '$1 $2').trim();
  const familyName = family.replace(/([a-z])([A-Z])/g, '$1 $2').trim();
  return spaced && spaced !== 'Regular' ? `${familyName} ${spaced}` : familyName;
}
