import * as cheerio from 'cheerio';
import type { Clue, FinalJeopardyClue, GameData, GameType } from '../shared/types/api';

const USER_AGENT = 'Mozilla/5.0 (Devvit App; Jeopardy Game)';

/**
 * Decode all HTML entities (named, decimal, hex) and handle double-encoding.
 * Uses cheerio's parser which supports the full HTML5 entity set.
 */
export function cleanHtmlText(text: string): string {
  let decoded = text;

  // Iteratively decode to handle double/triple-encoded entities
  // e.g. &amp;amp; → &amp; → &
  for (let i = 0; i < 3; i++) {
    const pass = cheerio.load(`<p>${decoded}</p>`, null, false)('p').text();
    if (pass === decoded) break;
    decoded = pass;
  }

  return decoded
    .replace(/\\/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Format a Date to YYYY-MM-DD string.
 */
function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Format a date string (YYYY-MM-DD) into a human-readable form.
 */
function formatDateHuman(dateStr: string): string {
  const parts = dateStr.split('-').map(Number);
  const y = parts[0] ?? 0;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return `${months[m - 1]} ${d}, ${y}`;
}

/**
 * Shuffle an array in place (Fisher-Yates).
 */
function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = temp;
  }
  return arr;
}

/**
 * Look up a J-Archive game ID by air date (YYYY-MM-DD).
 * Fetches the appropriate season page(s) and searches for the date in links.
 */
export async function lookupGameByDate(date: string): Promise<number | null> {
  const targetDate = new Date(date + 'T12:00:00Z');
  const year = targetDate.getUTCFullYear();
  const month = targetDate.getUTCMonth() + 1;

  // Jeopardy seasons run Sept-July. Calculate the season number.
  const seasonBase = month >= 9 ? year - 1983 : year - 1984;
  const seasonsToCheck = [seasonBase, seasonBase + 1, seasonBase - 1];

  for (const s of seasonsToCheck) {
    if (s < 1) continue;

    const url = `https://j-archive.com/showseason.php?season=${s}`;
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
      });
      if (!res.ok) continue;

      const html = await res.text();
      const $ = cheerio.load(html);

      let foundGameId: number | null = null;
      $('a').each((_i, el) => {
        const text = $(el).text();
        if (text.includes(date)) {
          const href = $(el).attr('href') ?? '';
          const match = href.match(/game_id=(\d+)/);
          if (match?.[1]) {
            foundGameId = parseInt(match[1], 10);
            return false; // break
          }
        }
      });

      if (foundGameId) return foundGameId;
    } catch {
      // Network error for this season, try next
      continue;
    }
  }

  return null;
}

/**
 * Scrape a full game from J-Archive by game ID.
 * Returns structured GameData with Jeopardy round clues and Final Jeopardy.
 */
export async function scrapeGame(
  gameId: number,
  airDate: string,
  gameType: GameType
): Promise<GameData | null> {
  const url = `https://j-archive.com/showgame.php?game_id=${gameId}`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    // Extract Jeopardy round categories
    const jCategories: string[] = [];
    $('#jeopardy_round .category_name').each((_i, el) => {
      jCategories.push(cleanHtmlText($(el).text()));
    });

    // Extract Final Jeopardy category
    const fjCategories: string[] = [];
    $('#final_jeopardy_round .category_name').each((_i, el) => {
      fjCategories.push(cleanHtmlText($(el).text()));
    });

    // Extract Double Jeopardy round categories
    const djCategories: string[] = [];
    $('#double_jeopardy_round .category_name').each((_i, el) => {
      djCategories.push(cleanHtmlText($(el).text()));
    });

    // Extract clues from both Jeopardy and Double Jeopardy rounds
    const clues: Clue[] = [];
    const djClues: Clue[] = [];
    $('.clue_text').each((_i, el) => {
      const $el = $(el);
      const id = $el.attr('id');
      if (!id || id.endsWith('_r')) return;

      const parts = id.split('_');
      if (parts.length < 4) return;

      const roundId = parts[1];
      if (roundId !== 'J' && roundId !== 'DJ') return;

      const colStr = parts[2];
      const rowStr = parts[3];
      if (!colStr || !rowStr) return;
      const col = parseInt(colStr, 10);
      const row = parseInt(rowStr, 10);
      if (isNaN(col) || isNaN(row)) return;

      const question = cleanHtmlText($el.text());
      const $answerEl = $(`#${id}_r`);
      const answer = cleanHtmlText($answerEl.find('.correct_response').text());
      if (!question || !answer) return;

      const isDJ = roundId === 'DJ';
      const value = isDJ ? row * 400 : row * 200;
      const cats = isDJ ? djCategories : jCategories;
      const categoryTitle = cats[col - 1] || `Category ${col}`;
      const idOffset = isDJ ? 2000 : 1000;
      const numericId = gameId * 10000 + idOffset + col * 10 + row;

      const clue: Clue = {
        id: numericId,
        question,
        answer,
        value,
        category: categoryTitle,
        col,
        row,
      };

      if (isDJ) {
        djClues.push(clue);
      } else {
        clues.push(clue);
      }
    });

    // Extract Final Jeopardy
    let finalJeopardy: FinalJeopardyClue | null = null;
    const fjClueEl = $('#clue_FJ');
    if (fjClueEl.length > 0) {
      const fjQuestion = cleanHtmlText(fjClueEl.text());
      const fjAnswer = cleanHtmlText($('#clue_FJ_r .correct_response').text());
      const fjCategory = fjCategories[0] || 'Final Jeopardy';
      if (fjQuestion && fjAnswer) {
        finalJeopardy = {
          category: fjCategory,
          question: fjQuestion,
          answer: fjAnswer,
        };
      }
    }

    // Build description
    const humanDate = formatDateHuman(airDate);
    const description =
      gameType === 'onthisday' ? `On This Day: ${humanDate}` : humanDate;

    console.log(
      `[scraper] Game ${gameId}: J=${clues.length} clues, DJ=${djClues.length} clues, FJ=${finalJeopardy ? 'yes' : 'no'}`
    );

    return {
      gameId,
      airDate,
      categories: jCategories.slice(0, 6),
      clues,
      djCategories: djCategories.slice(0, 6),
      djClues,
      finalJeopardy,
      gameType,
      description,
    };
  } catch (err) {
    console.error(`[scraper] Failed to scrape game ${gameId}:`, err);
    return null;
  }
}

/**
 * Find the most recent game by searching backward from yesterday.
 * Returns gameId and airDate, or null if nothing found within 14 days.
 */
export async function findLatestGame(): Promise<{ gameId: number; airDate: string } | null> {
  const today = new Date();
  console.log(`[scraper] Finding latest game from ${formatDate(today)}`);

  for (let daysBack = 1; daysBack <= 14; daysBack++) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysBack);
    const dateStr = formatDate(date);

    const gameId = await lookupGameByDate(dateStr);
    if (gameId) {
      console.log(`[scraper] Found latest game: id=${gameId}, date=${dateStr}`);
      return { gameId, airDate: dateStr };
    }
  }

  console.log('[scraper] No latest game found within 14 days');
  return null;
}

/**
 * Find a game that aired on this month/day in a random previous year.
 * Tries up to 10 shuffled years from the range 2000-2025.
 */
export async function findOnThisDayGame(): Promise<{ gameId: number; airDate: string } | null> {
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  console.log(`[scraper] Finding "On This Day" game for ${month}/${day}`);

  const currentYear = today.getFullYear();
  const years: number[] = [];
  for (let y = 2000; y < currentYear; y++) {
    years.push(y);
  }
  shuffleArray(years);

  for (const year of years.slice(0, 10)) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const gameId = await lookupGameByDate(dateStr);
    if (gameId) {
      console.log(`[scraper] Found "On This Day" game: id=${gameId}, date=${dateStr}`);
      return { gameId, airDate: dateStr };
    }
  }

  console.log('[scraper] No "On This Day" game found');
  return null;
}
