// Server-only data layer. MongoDB Atlas in production (MONGODB_URI env var).
// Without MONGODB_URI, development uses an in-memory store so the site runs locally.
// In production without MONGODB_URI, storeAvailable() is false and the API returns 503;
// the create page then falls back to the old long /play/#… links.
import "server-only";
import { createHash, randomBytes } from "crypto";
import { MongoClient, type Collection } from "mongodb";
import type { Pair } from "@/lib/quizRules";

export type QuizDoc = {
  _id: string; // short ID used in /q/<id>
  n: string; // creator's name
  a: Pair[]; // [questionIndex, answerIndex]
  ownerHash: string; // sha256 of the creator's secret token
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

/** Quizzes and results are deleted automatically after this many days (privacy: keep data minimal). */
export const RETENTION_DAYS = 180;
/** Partner-only game: cap stored attempts per quiz so a link can't be spammed. */
export const MAX_RESULTS_PER_QUIZ = 10;

const DB_NAME = process.env.MONGODB_DB || "kissandquiz";
const ID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function newQuizId(): string {
  const bytes = randomBytes(8);
  let id = "";
  for (const b of bytes) id += ID_CHARS[b % ID_CHARS.length];
  return id;
}

export function newOwnerToken(): string {
  return randomBytes(24).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function storeAvailable(): boolean {
  return Boolean(process.env.MONGODB_URI) || process.env.NODE_ENV !== "production";
}

interface Store {
  insertQuiz(doc: QuizDoc): Promise<void>;
  getQuiz(id: string): Promise<QuizDoc | null>;
  countResults(quizId: string): Promise<number>;
  insertResult(doc: ResultDoc): Promise<void>;
  listResults(quizId: string): Promise<ResultDoc[]>;
}

// ---------- MongoDB ----------
// Cache the client across invocations so serverless functions don't open a new
// connection on every request (standard pattern for Vercel + Atlas).
const g = globalThis as unknown as { _kqMongo?: Promise<MongoClient>; _kqIndexes?: Promise<void> };

async function collections(): Promise<{ quizzes: Collection<QuizDoc>; results: Collection<ResultDoc> }> {
  if (!g._kqMongo) {
    const client = new MongoClient(process.env.MONGODB_URI as string, {
      maxPoolSize: 5,
      appName: "kissandquiz",
    });
    g._kqMongo = client.connect().catch((err) => {
      g._kqMongo = undefined; // allow a retry on the next request
      throw err;
    });
  }
  const db = (await g._kqMongo).db(DB_NAME);
  const quizzes = db.collection<QuizDoc>("quizzes");
  const results = db.collection<ResultDoc>("results");
  if (!g._kqIndexes) {
    const ttl = RETENTION_DAYS * 24 * 60 * 60;
    g._kqIndexes = Promise.all([
      quizzes.createIndex({ createdAt: 1 }, { expireAfterSeconds: ttl }),
      results.createIndex({ createdAt: 1 }, { expireAfterSeconds: ttl }),
      results.createIndex({ quizId: 1, createdAt: -1 }),
    ])
      .then(() => undefined)
      .catch(() => {
        g._kqIndexes = undefined; // not fatal; try again next cold start
      });
  }
  return { quizzes, results };
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
};

// ---------- In-memory (local development only) ----------
const mem = globalThis as unknown as { _kqMem?: { quizzes: Map<string, QuizDoc>; results: ResultDoc[] } };
function memData() {
  if (!mem._kqMem) mem._kqMem = { quizzes: new Map(), results: [] };
  return mem._kqMem;
}
const memoryStore: Store = {
  async insertQuiz(doc) {
    if (memData().quizzes.has(doc._id)) throw Object.assign(new Error("duplicate"), { code: 11000 });
    memData().quizzes.set(doc._id, doc);
  },
  async getQuiz(id) {
    return memData().quizzes.get(id) ?? null;
  },
  async countResults(quizId) {
    return memData().results.filter((r) => r.quizId === quizId).length;
  },
  async insertResult(doc) {
    memData().results.push(doc);
  },
  async listResults(quizId) {
    return memData()
      .results.filter((r) => r.quizId === quizId)
      .sort((x, y) => y.createdAt.getTime() - x.createdAt.getTime())
      .slice(0, MAX_RESULTS_PER_QUIZ);
  },
};

export function store(): Store {
  return process.env.MONGODB_URI ? mongoStore : memoryStore;
}
