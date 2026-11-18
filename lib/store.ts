// Server-only data layer. MongoDB Atlas in production (MONGODB_URI env var).
// Without MONGODB_URI, development uses an in-memory store so the site runs locally.
// In production without MONGODB_URI, storeAvailable() is false and the API returns 503;
// the create page then falls back to the old long /play/#… links.
import "server-only";
import { createHash, randomBytes } from "crypto";
import { MongoClient, type Collection } from "mongodb";
import type { Pair } from "@/lib/quizRules";
import type { Answer, GameType, Score } from "@/lib/reveal/types";

export type QuizDoc = {
  _id: string; // short ID used in /q/<id>
  n: string; // creator's name
  a: Pair[]; // [questionIndex, answerIndex]
  ownerHash: string; // sha256 of the creator's secret token
  ownerUserId?: string; // set when the creator has an account
  /** Kiss Wallet: kisses this quiz is played for, and the maker's wallet (optional). */
  stake?: number;
  walletId?: string;
  createdAt: Date;
};

export type ResultDoc = {
  quizId: string;
  partner: string | null; // partner's name, optional
  guesses: (number | null)[];
  score: number;
  total: number;
  createdAt: Date;
};

/** Optional creator profile. One per email (unique index). */
export type UserDoc = {
  _id: string;
  email: string; // lower-cased
  name: string;
  createdAt: Date;
  lastLoginAt: Date;
};

/** One-time sign-in link. Stored hashed; expires after LOGIN_TOKEN_MINUTES. */
export type LoginTokenDoc = { _id: string; email: string; name: string; createdAt: Date };

/** Signed-in browser. Stored hashed; expires after SESSION_DAYS. */
export type SessionDoc = { _id: string; userId: string; createdAt: Date };

/** One player in a reveal game (Would You Rather etc.). Only the token's hash is stored. */
export type GamePlayer = {
  name: string;
  tokenHash: string;
  /** One entry per round; null until that round is answered. */
  answers: (Answer | null)[];
  joinedAt: Date;
  finishedAt?: Date;
  /** Set when both players have finished (for the future Kiss Wallet). */
  score?: { correct: number; matches: number };
  /** Kiss Wallet of this player, if they have one. Never sent to the browser. */
  walletId?: string;
};

/** A two-player reveal game. players[0] = creator (A), players[1] = partner (B). */
export type GameDoc = {
  _id: string; // short ID used in /w/<id>
  type: GameType;
  q: number[]; // question indexes (stable IDs in the game's bank)
  players: GamePlayer[];
  createdAt: Date;
  joinedAt?: Date; // when B joined
  finishedAt?: Date; // when both had answered every round
  /** Kisses this game is played for (Kiss Wallet rule C1). Missing on older games = 1. */
  stake?: number;
};

/** Kiss Wallet (docs/KISS_WALLET_RULES.md). One per person, no sign-up. Only the secret's hash is stored. */
export type WalletDoc = {
  _id: string; // 12 chars
  name: string;
  tokenHash: string;
  createdAt: Date;
  lastActiveAt: Date;
};

/** A khata = the shared kiss balance between two wallets. `owed[w]` = kisses owed TO wallet w. */
export type KhataDoc = {
  _id: string; // khataId(a, b)
  w: [string, string];
  owed: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
};

export type KissKind = "win" | "tie" | "bonus" | "gift" | "received" | "forgive";

/** One line of khata history. `amount` changes owed[to] (negative = paid or forgiven). */
export type KissLogDoc = {
  _id: string; // deterministic for game results (one per game), random otherwise
  khata: string;
  to: string;
  by: string;
  amount: number;
  kind: KissKind;
  game?: { type: "wyr" | "quiz"; id: string };
  /** Rate-card item for "received", e.g. "Movie kiss". */
  label?: string;
  /** The daily or khata limit cut this earning (amount may be 0). */
  capped?: boolean;
  createdAt: Date;
};

/** Fixed-window request counter for rate limits. `_id` = action:ipHash:window. */
export type RateDoc = { _id: string; n: number; createdAt: Date };

/** Quizzes and results are deleted automatically after this many days (privacy: keep data minimal). */
export const RETENTION_DAYS = 180;
/** Partner-only game: cap stored attempts per quiz so a link can't be spammed. */
export const MAX_RESULTS_PER_QUIZ = 10;
export const LOGIN_TOKEN_MINUTES = 15;
export const SESSION_DAYS = 30;
/** Max sign-in emails per address within LOGIN_TOKEN_MINUTES. */
export const MAX_LOGIN_EMAILS = 3;
/** Rate-limit counters (hashed IPs) are deleted after this long. */
export const RATE_KEEP_SECONDS = 2 * 60 * 60;

const DB_NAME = process.env.MONGODB_DB || "kissandquiz";
const ID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function randomId(len: number): string {
  const bytes = randomBytes(len);
  let id = "";
  for (const b of bytes) id += ID_CHARS[b % ID_CHARS.length];
  return id;
}

export function newQuizId(): string {
  return randomId(8);
}

export function newUserId(): string {
  return randomId(16);
}

export function newWalletId(): string {
  return randomId(12);
}

/** Random secret for owner tokens, login links and sessions. */
export function newSecret(): string {
  return randomBytes(24).toString("base64url");
}
export const newOwnerToken = newSecret;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function storeAvailable(): boolean {
  return Boolean(process.env.MONGODB_URI) || process.env.NODE_ENV !== "production";
}

interface Store {
  // quizzes + results
  insertQuiz(doc: QuizDoc): Promise<void>;
  getQuiz(id: string): Promise<QuizDoc | null>;
  countResults(quizId: string): Promise<number>;
  insertResult(doc: ResultDoc): Promise<void>;
  listResults(quizId: string): Promise<ResultDoc[]>;
  listQuizzesByOwner(userId: string): Promise<QuizDoc[]>;
  /** Attach a quiz to an account if the owner token matches and it has no owner yet. */
  claimQuiz(id: string, ownerHash: string, userId: string): Promise<boolean>;
  // accounts
  getUser(id: string): Promise<UserDoc | null>;
  findUserByEmail(email: string): Promise<UserDoc | null>;
  /** Insert if no user has this email; return the (existing or new) user. */
  upsertUserByEmail(doc: UserDoc): Promise<UserDoc>;
  updateUser(id: string, patch: Partial<Pick<UserDoc, "name" | "lastLoginAt">>): Promise<void>;
  /** Delete the user, their sessions, their quizzes and those quizzes' results. */
  deleteUserCascade(id: string): Promise<void>;
  insertLoginToken(doc: LoginTokenDoc): Promise<void>;
  countRecentLoginTokens(email: string): Promise<number>;
  /** Read and delete in one step, so a link works once. Null if missing or expired. */
  takeLoginToken(hash: string): Promise<LoginTokenDoc | null>;
  insertSession(doc: SessionDoc): Promise<void>;
  getSession(hash: string): Promise<SessionDoc | null>;
  deleteSession(hash: string): Promise<void>;
  // reveal games
  insertGame(doc: GameDoc): Promise<void>;
  getGame(id: string): Promise<GameDoc | null>;
  /** Atomically take slot B. False if someone already has it. */
  joinGame(id: string, player: GamePlayer, at: Date): Promise<boolean>;
  /**
   * Save one answer, only if that round is still empty for that player (so a round can't be
   * changed after the reveal, even with two requests at once). `finish` is set on the last round.
   */
  saveRound(
    id: string,
    player: 0 | 1,
    tokenHash: string,
    round: number,
    answer: Answer,
    finish?: { at: Date; score: Score },
  ): Promise<boolean>;
  /** Count one request in a rate-limit window and return the new count. */
  hitRate(key: string): Promise<number>;
  // kiss wallet
  insertWallet(doc: WalletDoc): Promise<void>;
  getWallet(id: string): Promise<WalletDoc | null>;
  updateWallet(id: string, patch: Partial<Pick<WalletDoc, "name" | "lastActiveAt">>): Promise<void>;
  /** Delete the wallet, every khata it is in, and their history. */
  deleteWalletCascade(id: string): Promise<void>;
  /** Create the khata if missing; always bumps updatedAt. */
  ensureKhata(id: string, w: [string, string], at: Date): Promise<void>;
  getKhata(id: string): Promise<KhataDoc | null>;
  listKhatas(walletId: string): Promise<KhataDoc[]>;
  /** owed[to] += amount (amount > 0). */
  addOwed(id: string, to: string, amount: number, at: Date): Promise<void>;
  /** owed[to] -= amount, only if owed[to] >= amount (atomic). False if not enough. */
  takeOwed(id: string, to: string, amount: number, at: Date): Promise<boolean>;
  /** False if a line with this _id already exists (a game is only counted once). */
  insertKissLog(doc: KissLogDoc): Promise<boolean>;
  listKissLog(khata: string, limit: number): Promise<KissLogDoc[]>;
  /** Sum of amounts in a khata for lines matching `to`/`by` and kinds, since a date. */
  sumKissLog(khata: string, match: { to?: string; by?: string }, kinds: KissKind[], since: Date): Promise<number>;
}

const minutesAgo = (m: number) => new Date(Date.now() - m * 60 * 1000);

// ---------- MongoDB ----------
// Cache the client across invocations so serverless functions don't open a new
// connection on every request (standard pattern for Vercel + Atlas).
const g = globalThis as unknown as { _kqMongo?: Promise<MongoClient>; _kqIndexes?: Promise<void> };

type Cols = {
  quizzes: Collection<QuizDoc>;
  results: Collection<ResultDoc>;
  users: Collection<UserDoc>;
  loginTokens: Collection<LoginTokenDoc>;
  sessions: Collection<SessionDoc>;
  games: Collection<GameDoc>;
  rateLimits: Collection<RateDoc>;
  wallets: Collection<WalletDoc>;
  khatas: Collection<KhataDoc>;
  kissLog: Collection<KissLogDoc>;
};

async function collections(): Promise<Cols> {
  if (!g._kqMongo) {
    // Fail fast (default is 30 s) so pages can show a friendly "try again" before the
    // Vercel function itself times out.
    const client = new MongoClient(process.env.MONGODB_URI as string, {
      maxPoolSize: 5,
      appName: "kissandquiz",
      serverSelectionTimeoutMS: 7000,
      connectTimeoutMS: 7000,
    });
    g._kqMongo = client.connect().catch((err) => {
      g._kqMongo = undefined; // allow a retry on the next request
      throw err;
    });
  }
  const db = (await g._kqMongo).db(DB_NAME);
  const c: Cols = {
    quizzes: db.collection<QuizDoc>("quizzes"),
    results: db.collection<ResultDoc>("results"),
    users: db.collection<UserDoc>("users"),
    loginTokens: db.collection<LoginTokenDoc>("loginTokens"),
    sessions: db.collection<SessionDoc>("sessions"),
    games: db.collection<GameDoc>("games"),
    rateLimits: db.collection<RateDoc>("rateLimits"),
    wallets: db.collection<WalletDoc>("wallets"),
    khatas: db.collection<KhataDoc>("khatas"),
    kissLog: db.collection<KissLogDoc>("kissLog"),
  };
  if (!g._kqIndexes) {
    const day = 24 * 60 * 60;
    g._kqIndexes = Promise.all([
      c.quizzes.createIndex({ createdAt: 1 }, { expireAfterSeconds: RETENTION_DAYS * day }),
      c.quizzes.createIndex({ ownerUserId: 1, createdAt: -1 }),
      c.results.createIndex({ createdAt: 1 }, { expireAfterSeconds: RETENTION_DAYS * day }),
      c.results.createIndex({ quizId: 1, createdAt: -1 }),
      c.users.createIndex({ email: 1 }, { unique: true }),
      c.loginTokens.createIndex({ createdAt: 1 }, { expireAfterSeconds: LOGIN_TOKEN_MINUTES * 60 }),
      c.loginTokens.createIndex({ email: 1 }),
      c.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: SESSION_DAYS * day }),
      c.games.createIndex({ createdAt: 1 }, { expireAfterSeconds: RETENTION_DAYS * day }),
      c.rateLimits.createIndex({ createdAt: 1 }, { expireAfterSeconds: RATE_KEEP_SECONDS }),
      // Kiss Wallet: deleted after 180 days without activity (rule F4).
      c.wallets.createIndex({ lastActiveAt: 1 }, { expireAfterSeconds: RETENTION_DAYS * day }),
      c.khatas.createIndex({ updatedAt: 1 }, { expireAfterSeconds: RETENTION_DAYS * day }),
      c.khatas.createIndex({ w: 1 }),
      c.kissLog.createIndex({ createdAt: 1 }, { expireAfterSeconds: RETENTION_DAYS * day }),
      c.kissLog.createIndex({ khata: 1, createdAt: -1 }),
    ])
      .then(() => undefined)
      .catch(() => {
        g._kqIndexes = undefined; // not fatal; try again next cold start
      });
  }
  await g._kqIndexes; // the unique email index must exist before accounts are created
  return c;
}

const mongoStore: Store = {
  async insertQuiz(doc) {
    await (await collections()).quizzes.insertOne(doc);
  },
  async getQuiz(id) {
    return (await collections()).quizzes.findOne({ _id: id });
  },
  async countResults(quizId) {
    return (await collections()).results.countDocuments({ quizId });
  },
  async insertResult(doc) {
    await (await collections()).results.insertOne(doc);
  },
  async listResults(quizId) {
    return (await collections()).results.find({ quizId }).sort({ createdAt: -1 }).limit(MAX_RESULTS_PER_QUIZ).toArray();
  },
  async listQuizzesByOwner(userId) {
    return (await collections()).quizzes.find({ ownerUserId: userId }).sort({ createdAt: -1 }).limit(50).toArray();
  },
  async claimQuiz(id, ownerHash, userId) {
    const r = await (await collections()).quizzes.updateOne(
      { _id: id, ownerHash, ownerUserId: { $exists: false } },
      { $set: { ownerUserId: userId } },
    );
    return r.modifiedCount === 1;
  },
  async getUser(id) {
    return (await collections()).users.findOne({ _id: id });
  },
  async findUserByEmail(email) {
    return (await collections()).users.findOne({ email });
  },
  async upsertUserByEmail(doc) {
    const { _id, ...rest } = doc;
    const users = (await collections()).users;
    try {
      await users.updateOne({ email: doc.email }, { $setOnInsert: { _id, ...rest } }, { upsert: true });
    } catch (err) {
      if ((err as { code?: number }).code !== 11000) throw err; // two logins at once: the other one won
    }
    return (await users.findOne({ email: doc.email })) as UserDoc;
  },
  async updateUser(id, patch) {
    await (await collections()).users.updateOne({ _id: id }, { $set: patch });
  },
  async deleteUserCascade(id) {
    const c = await collections();
    const ids = (await c.quizzes.find({ ownerUserId: id }, { projection: { _id: 1 } }).toArray()).map((q) => q._id);
    await c.results.deleteMany({ quizId: { $in: ids } });
    await c.quizzes.deleteMany({ ownerUserId: id });
    await c.sessions.deleteMany({ userId: id });
    await c.users.deleteOne({ _id: id });
  },
  async insertLoginToken(doc) {
    await (await collections()).loginTokens.insertOne(doc);
  },
  async countRecentLoginTokens(email) {
    return (await collections()).loginTokens.countDocuments({ email, createdAt: { $gt: minutesAgo(LOGIN_TOKEN_MINUTES) } });
  },
  async takeLoginToken(hash) {
    const doc = await (await collections()).loginTokens.findOneAndDelete({ _id: hash });
    // TTL deletion runs about once a minute, so check the age too.
    return doc && doc.createdAt > minutesAgo(LOGIN_TOKEN_MINUTES) ? doc : null;
  },
  async insertSession(doc) {
    await (await collections()).sessions.insertOne(doc);
  },
  async getSession(hash) {
    const s = await (await collections()).sessions.findOne({ _id: hash });
    return s && s.createdAt > minutesAgo(SESSION_DAYS * 24 * 60) ? s : null;
  },
  async deleteSession(hash) {
    await (await collections()).sessions.deleteOne({ _id: hash });
  },
  async insertGame(doc) {
    await (await collections()).games.insertOne(doc);
  },
  async getGame(id) {
    return (await collections()).games.findOne({ _id: id });
  },
  async joinGame(id, player, at) {
    const r = await (await collections()).games.updateOne(
      { _id: id, "players.1": { $exists: false } },
      { $push: { players: player }, $set: { joinedAt: at } },
    );
    return r.modifiedCount === 1;
  },
  async saveRound(id, player, tokenHash, round, answer, finish) {
    const set: Record<string, unknown> = { [`players.${player}.answers.${round}`]: answer };
    if (finish) {
      set.finishedAt = finish.at;
      set[`players.${player}.finishedAt`] = finish.at;
      set["players.0.score"] = { correct: finish.score.correct[0], matches: finish.score.matches };
      set["players.1.score"] = { correct: finish.score.correct[1], matches: finish.score.matches };
    }
    const r = await (await collections()).games.updateOne(
      { _id: id, [`players.${player}.tokenHash`]: tokenHash, [`players.${player}.answers.${round}`]: null },
      { $set: set },
    );
    return r.modifiedCount === 1;
  },
  async hitRate(key) {
    const doc = await (await collections()).rateLimits.findOneAndUpdate(
      { _id: key },
      { $inc: { n: 1 }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true, returnDocument: "after" },
    );
    return doc?.n ?? 1;
  },
  async insertWallet(doc) {
    await (await collections()).wallets.insertOne(doc);
  },
  async getWallet(id) {
    return (await collections()).wallets.findOne({ _id: id });
  },
  async updateWallet(id, patch) {
    await (await collections()).wallets.updateOne({ _id: id }, { $set: patch });
  },
  async deleteWalletCascade(id) {
    const c = await collections();
    const ids = (await c.khatas.find({ w: id }, { projection: { _id: 1 } }).toArray()).map((k) => k._id);
    await c.kissLog.deleteMany({ khata: { $in: ids } });
    await c.khatas.deleteMany({ _id: { $in: ids } });
    await c.wallets.deleteOne({ _id: id });
  },
  async ensureKhata(id, w, at) {
    await (await collections()).khatas.updateOne(
      { _id: id },
      { $setOnInsert: { w, owed: { [w[0]]: 0, [w[1]]: 0 }, createdAt: at }, $set: { updatedAt: at } },
      { upsert: true },
    );
  },
  async getKhata(id) {
    return (await collections()).khatas.findOne({ _id: id });
  },
  async listKhatas(walletId) {
    return (await collections()).khatas.find({ w: walletId }).sort({ updatedAt: -1 }).limit(20).toArray();
  },
  async addOwed(id, to, amount, at) {
    await (await collections()).khatas.updateOne({ _id: id }, { $inc: { [`owed.${to}`]: amount }, $set: { updatedAt: at } });
  },
  async takeOwed(id, to, amount, at) {
    const r = await (await collections()).khatas.updateOne(
      { _id: id, [`owed.${to}`]: { $gte: amount } },
      { $inc: { [`owed.${to}`]: -amount }, $set: { updatedAt: at } },
    );
    return r.modifiedCount === 1;
  },
  async insertKissLog(doc) {
    try {
      await (await collections()).kissLog.insertOne(doc);
      return true;
    } catch (err) {
      if ((err as { code?: number }).code === 11000) return false;
      throw err;
    }
  },
  async listKissLog(khata, limit) {
    return (await collections()).kissLog.find({ khata }).sort({ createdAt: -1 }).limit(limit).toArray();
  },
  async sumKissLog(khata, match, kinds, since) {
    const rows = await (await collections()).kissLog
      .aggregate<{ n: number }>([
        { $match: { khata, ...match, kind: { $in: kinds }, createdAt: { $gt: since } } },
        { $group: { _id: null, n: { $sum: "$amount" } } },
      ])
      .toArray();
    return rows[0]?.n ?? 0;
  },
};

// ---------- In-memory (local development only) ----------
type Mem = {
  quizzes: Map<string, QuizDoc>;
  results: ResultDoc[];
  users: Map<string, UserDoc>;
  loginTokens: Map<string, LoginTokenDoc>;
  sessions: Map<string, SessionDoc>;
  games: Map<string, GameDoc>;
  rates: Map<string, number>;
  wallets: Map<string, WalletDoc>;
  khatas: Map<string, KhataDoc>;
  kissLog: Map<string, KissLogDoc>;
};
const memHolder = globalThis as unknown as { _kqMem?: Mem };
function m(): Mem {
  if (!memHolder._kqMem) {
    memHolder._kqMem = {
      quizzes: new Map(),
      results: [],
      users: new Map(),
      loginTokens: new Map(),
      sessions: new Map(),
      games: new Map(),
      rates: new Map(),
      wallets: new Map(),
      khatas: new Map(),
      kissLog: new Map(),
    };
  }
  // Older dev-server state (before games existed) may lack these.
  memHolder._kqMem.games ??= new Map();
  memHolder._kqMem.rates ??= new Map();
  memHolder._kqMem.wallets ??= new Map();
  memHolder._kqMem.khatas ??= new Map();
  memHolder._kqMem.kissLog ??= new Map();
  return memHolder._kqMem;
}
const memoryStore: Store = {
  async insertQuiz(doc) {
    if (m().quizzes.has(doc._id)) throw Object.assign(new Error("duplicate"), { code: 11000 });
    m().quizzes.set(doc._id, doc);
  },
  async getQuiz(id) {
    return m().quizzes.get(id) ?? null;
  },
  async countResults(quizId) {
    return m().results.filter((r) => r.quizId === quizId).length;
  },
  async insertResult(doc) {
    m().results.push(doc);
  },
  async listResults(quizId) {
    return m()
      .results.filter((r) => r.quizId === quizId)
      .sort((x, y) => y.createdAt.getTime() - x.createdAt.getTime())
      .slice(0, MAX_RESULTS_PER_QUIZ);
  },
  async listQuizzesByOwner(userId) {
    return [...m().quizzes.values()]
      .filter((q) => q.ownerUserId === userId)
      .sort((x, y) => y.createdAt.getTime() - x.createdAt.getTime());
  },
  async claimQuiz(id, ownerHash, userId) {
    const q = m().quizzes.get(id);
    if (!q || q.ownerHash !== ownerHash || q.ownerUserId) return false;
    q.ownerUserId = userId;
    return true;
  },
  async getUser(id) {
    return m().users.get(id) ?? null;
  },
  async findUserByEmail(email) {
    return [...m().users.values()].find((u) => u.email === email) ?? null;
  },
  async upsertUserByEmail(doc) {
    const existing = await this.findUserByEmail(doc.email);
    if (existing) return existing;
    m().users.set(doc._id, doc);
    return doc;
  },
  async updateUser(id, patch) {
    const u = m().users.get(id);
    if (u) Object.assign(u, patch);
  },
  async deleteUserCascade(id) {
    const ids = [...m().quizzes.values()].filter((q) => q.ownerUserId === id).map((q) => q._id);
    m().results = m().results.filter((r) => !ids.includes(r.quizId));
    ids.forEach((qid) => m().quizzes.delete(qid));
    for (const [k, s] of m().sessions) if (s.userId === id) m().sessions.delete(k);
    m().users.delete(id);
  },
  async insertLoginToken(doc) {
    m().loginTokens.set(doc._id, doc);
  },
  async countRecentLoginTokens(email) {
    const since = minutesAgo(LOGIN_TOKEN_MINUTES);
    return [...m().loginTokens.values()].filter((t) => t.email === email && t.createdAt > since).length;
  },
  async takeLoginToken(hash) {
    const t = m().loginTokens.get(hash) ?? null;
    m().loginTokens.delete(hash);
    return t && t.createdAt > minutesAgo(LOGIN_TOKEN_MINUTES) ? t : null;
  },
  async insertSession(doc) {
    m().sessions.set(doc._id, doc);
  },
  async getSession(hash) {
    return m().sessions.get(hash) ?? null;
  },
  async deleteSession(hash) {
    m().sessions.delete(hash);
  },
  // Copies in and out, so callers can't change stored data by accident (like a real DB).
  async insertGame(doc) {
    if (m().games.has(doc._id)) throw Object.assign(new Error("duplicate"), { code: 11000 });
    m().games.set(doc._id, structuredClone(doc));
  },
  async getGame(id) {
    const g = m().games.get(id);
    return g ? structuredClone(g) : null;
  },
  async joinGame(id, player, at) {
    const g = m().games.get(id);
    if (!g || g.players.length >= 2) return false;
    g.players.push(structuredClone(player));
    g.joinedAt = at;
    return true;
  },
  async saveRound(id, player, tokenHash, round, answer, finish) {
    const p = m().games.get(id)?.players[player];
    if (!p || p.tokenHash !== tokenHash || p.answers[round] !== null) return false;
    p.answers[round] = { ...answer };
    if (finish) {
      const g = m().games.get(id) as GameDoc;
      g.finishedAt = finish.at;
      p.finishedAt = finish.at;
      g.players[0].score = { correct: finish.score.correct[0], matches: finish.score.matches };
      g.players[1].score = { correct: finish.score.correct[1], matches: finish.score.matches };
    }
    return true;
  },
  async hitRate(key) {
    const n = (m().rates.get(key) ?? 0) + 1;
    m().rates.set(key, n);
    return n;
  },
  async insertWallet(doc) {
    if (m().wallets.has(doc._id)) throw Object.assign(new Error("duplicate"), { code: 11000 });
    m().wallets.set(doc._id, structuredClone(doc));
  },
  async getWallet(id) {
    const w = m().wallets.get(id);
    return w ? structuredClone(w) : null;
  },
  async updateWallet(id, patch) {
    const w = m().wallets.get(id);
    if (w) Object.assign(w, patch);
  },
  async deleteWalletCascade(id) {
    for (const [kid, k] of m().khatas) {
      if (!k.w.includes(id)) continue;
      for (const [lid, l] of m().kissLog) if (l.khata === kid) m().kissLog.delete(lid);
      m().khatas.delete(kid);
    }
    m().wallets.delete(id);
  },
  async ensureKhata(id, w, at) {
    const k = m().khatas.get(id);
    if (k) k.updatedAt = at;
    else m().khatas.set(id, { _id: id, w: [...w], owed: { [w[0]]: 0, [w[1]]: 0 }, createdAt: at, updatedAt: at });
  },
  async getKhata(id) {
    const k = m().khatas.get(id);
    return k ? structuredClone(k) : null;
  },
  async listKhatas(walletId) {
    return [...m().khatas.values()]
      .filter((k) => k.w.includes(walletId))
      .sort((x, y) => y.updatedAt.getTime() - x.updatedAt.getTime())
      .map((k) => structuredClone(k));
  },
  async addOwed(id, to, amount, at) {
    const k = m().khatas.get(id);
    if (!k) return;
    k.owed[to] = (k.owed[to] ?? 0) + amount;
    k.updatedAt = at;
  },
  async takeOwed(id, to, amount, at) {
    const k = m().khatas.get(id);
    if (!k || (k.owed[to] ?? 0) < amount) return false;
    k.owed[to] -= amount;
    k.updatedAt = at;
    return true;
  },
  async insertKissLog(doc) {
    if (m().kissLog.has(doc._id)) return false;
    m().kissLog.set(doc._id, structuredClone(doc));
    return true;
  },
  async listKissLog(khata, limit) {
    return [...m().kissLog.values()]
      .filter((l) => l.khata === khata)
      .sort((x, y) => y.createdAt.getTime() - x.createdAt.getTime())
      .slice(0, limit)
      .map((l) => structuredClone(l));
  },
  async sumKissLog(khata, match, kinds, since) {
    return [...m().kissLog.values()]
      .filter(
        (l) =>
          l.khata === khata &&
          (!match.to || l.to === match.to) &&
          (!match.by || l.by === match.by) &&
          kinds.includes(l.kind) &&
          l.createdAt > since,
      )
      .reduce((n, l) => n + l.amount, 0);
  },
};

export function store(): Store {
  return process.env.MONGODB_URI ? mongoStore : memoryStore;
}
