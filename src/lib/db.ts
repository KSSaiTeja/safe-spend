import { createClient } from "@supabase/supabase-js";
import { IncomeSource, SpendEntry } from "./finance";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * SQL SCHEMA CREATION SCRIPT FOR SUPABASE (100% Free PostgreSQL)
 * Paste this into Supabase SQL Editor to create all tables:
 * 
 * CREATE TABLE IF NOT EXISTS spends (
 *   id TEXT PRIMARY KEY,
 *   date TEXT NOT NULL,
 *   amount NUMERIC NOT NULL,
 *   category_id TEXT NOT NULL,
 *   paid_by TEXT NOT NULL,
 *   card_id TEXT,
 *   note TEXT,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * CREATE TABLE IF NOT EXISTS incomes (
 *   id TEXT PRIMARY KEY,
 *   month TEXT NOT NULL,
 *   name TEXT NOT NULL,
 *   amount NUMERIC NOT NULL,
 *   expected_date TEXT NOT NULL,
 *   status TEXT NOT NULL DEFAULT 'expected',
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * ALTER TABLE spends ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Public full access spends" ON spends FOR ALL USING (true);
 * CREATE POLICY "Public full access incomes" ON incomes FOR ALL USING (true);
 */

export async function fetchSpendsFromDb(): Promise<SpendEntry[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("spends")
      .select("*")
      .order("date", { ascending: false });

    if (error || !data) {
      console.warn("Supabase fetch error:", error?.message);
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      date: row.date,
      amount: Number(row.amount),
      categoryId: row.category_id,
      paidBy: row.paid_by,
      cardId: row.card_id || undefined,
      note: row.note || undefined,
    }));
  } catch (e) {
    console.error("DB Error:", e);
    return [];
  }
}

export async function saveSpendToDb(entry: SpendEntry): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from("spends").upsert({
      id: entry.id,
      date: entry.date,
      amount: entry.amount,
      category_id: entry.categoryId,
      paid_by: entry.paidBy,
      card_id: entry.cardId || null,
      note: entry.note || null,
    });

    if (error) {
      console.error("Supabase spend save error:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("DB Error:", e);
    return false;
  }
}

export async function deleteSpendFromDb(entryId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from("spends").delete().eq("id", entryId);
    if (error) {
      console.error("Supabase spend delete error:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("DB Error:", e);
    return false;
  }
}

export async function fetchIncomesFromDb(selectedMonth: string): Promise<IncomeSource[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("incomes")
      .select("*")
      .eq("month", selectedMonth);

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      name: row.name,
      amount: Number(row.amount),
      expectedDate: row.expected_date,
      status: row.status as "expected" | "received",
    }));
  } catch (e) {
    console.error("DB Error:", e);
    return [];
  }
}

export async function saveIncomeToDb(source: IncomeSource, selectedMonth: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from("incomes").upsert({
      id: source.id,
      month: selectedMonth,
      name: source.name,
      amount: source.amount,
      expected_date: source.expectedDate,
      status: source.status,
    });

    if (error) {
      console.error("Supabase income save error:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("DB Error:", e);
    return false;
  }
}

export async function deleteIncomeFromDb(incomeId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from("incomes").delete().eq("id", incomeId);
    if (error) return false;
    return true;
  } catch (e) {
    console.error("DB Error:", e);
    return false;
  }
}
