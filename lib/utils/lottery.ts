/**
 * Seat-aware weighted lottery selection.
 *
 * Each entry carries a fractional `score` (priority weight) and a `seats` cost
 * (1 for a solo entrant, 2 for a +1 pair).  The algorithm draws entries one at a
 * time, proportional to score, until `availableSeats` are exhausted.  If only
 * entries that need more seats than remain are left, the loop stops — those slots
 * go unfilled rather than being split.
 *
 * Mutates `pool` (removes selected entries in-place).
 */

export type RegistrationRef = {
  registration: { id: string };
  user: { id: string; name: string | null; email: string | null };
};

export type LotteryEntry =
  | { score: number; seats: 1; isPair: false; reg: RegistrationRef }
  | { score: number; seats: 2; isPair: true; inviterReg: RegistrationRef; inviteeReg: RegistrationRef };

export function weightedSelectWithSeats(
  pool: LotteryEntry[],
  availableSeats: number,
): LotteryEntry[] {
  const selected: LotteryEntry[] = [];
  let seatsLeft = availableSeats;

  while (seatsLeft > 0 && pool.length > 0) {
    const fittable = pool.filter(e => e.seats <= seatsLeft);
    if (fittable.length === 0) break; // only pairs remain and only 1 seat left

    const totalWeight = fittable.reduce((sum, e) => sum + e.score, 0);
    let r = Math.random() * totalWeight;
    let picked = fittable[fittable.length - 1]; // fallback to last (handles float rounding)
    for (const e of fittable) {
      r -= e.score;
      if (r <= 0) { picked = e; break; }
    }

    selected.push(picked);
    seatsLeft -= picked.seats;
    pool.splice(pool.indexOf(picked), 1);
  }

  return selected;
}
