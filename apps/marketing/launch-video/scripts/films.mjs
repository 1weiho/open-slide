import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const root = path.resolve(import.meta.dirname, '..');
export const FILM_ID = /^[a-z0-9][a-z0-9-]*$/;

export function listFilms() {
  const dir = path.join(root, 'films');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && FILM_ID.test(e.name))
    .filter((e) => fs.existsSync(path.join(dir, e.name, 'film.js')))
    .map((e) => e.name)
    .sort();
}

export async function loadFilm(id) {
  const films = listFilms();
  if (!id) {
    if (films.length === 1) [id] = films;
    else throw new Error(`pick a film: ${films.join(', ')}`);
  }
  if (!films.includes(id)) throw new Error(`no film "${id}" (films: ${films.join(', ')})`);
  const mod = await import(pathToFileURL(path.join(root, 'films', id, 'film.js')).href);
  return { ...mod.default, id };
}

export const filmOut = (id, ...rest) => path.join(root, 'out', id, ...rest);
