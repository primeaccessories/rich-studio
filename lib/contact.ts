/**
 * The studio's real contact details, in one place.
 *
 * Every address and hour here is verbatim from richcolvill.com. An earlier
 * build invented hello@richcolvill.com, which does not exist — so these
 * live in one module rather than being retyped per page, because two
 * copies is how a wrong address gets back in.
 */

export const STUDIO_EMAIL = 'letsdothis@richcolvill.com';

export const HOURS = 'BY APPOINTMENT ONLY   11A – 4P MONDAY, THURSDAY';

export interface Desk {
  role: string;
  email: string;
}

export const DESKS: Desk[] = [
  { role: 'COLLABORATIONS', email: 'RICH@RICHCOLVILL.COM' },
  { role: 'ENQUIRIES', email: 'TARA@RICHCOLVILL.COM' },
  { role: 'BUSINESS', email: 'CHRIS@RICHCOLVILL.COM' },
];
