import { createClient } from "@supabase/supabase-js";
import { neon } from "@neondatabase/serverless";
import { IncomeSource, SpendEntry } from "./finance";

const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || "";
export const neonSql = databaseUrl ? neon(databaseUrl) : null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isDbConfigured = Boolean(neonSql || supabase);
export const isSupabaseConfigured = isDbConfigured;

export async function fetchSpendsFromDb(): Promise<SpendEntry[]> {
  if (neonSql) {
    try {
      const rows = (await neonSql`
        SELECT id, date, amount, category_id, paid_by, card_id, note 
        FROM spends 
        ORDER BY date DESC
      `) as any[];
      return rows.map((row) => ({
        id: row.id,
        date: row.date,
        amount: Number(row.amount),
        categoryId: row.category_id,
        paidBy: row.paid_by,
        cardId: row.card_id || undefined,
        note: row.note || undefined,
      }));
    } catch (e) {
      console.error("Neon DB fetchSpends error:", e);
      return [];
    }
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("spends")
        .select("*")
        .order("date", { ascending: false });

      if (error || !data) return [];
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
      console.error("Supabase fetchSpends error:", e);
      return [];
    }
  }

  return [];
}

export async function saveSpendToDb(entry: SpendEntry): Promise<boolean> {
  if (neonSql) {
    try {
      await neonSql`
        INSERT INTO spends (id, date, amount, category_id, paid_by, card_id, note)
        VALUES (${entry.id}, ${entry.date}, ${entry.amount}, ${entry.categoryId}, ${entry.paidBy}, ${entry.cardId || null}, ${entry.note || null})
        ON CONFLICT (id) DO UPDATE SET
          date = EXCLUDED.date,
          amount = EXCLUDED.amount,
          category_id = EXCLUDED.category_id,
          paid_by = EXCLUDED.paid_by,
          card_id = EXCLUDED.card_id,
          note = EXCLUDED.note;
      `;
      return true;
    } catch (e) {
      console.error("Neon DB saveSpend error:", e);
      return false;
    }
  }

  if (supabase) {
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
      return !error;
    } catch (e) {
      console.error("Supabase saveSpend error:", e);
      return false;
    }
  }

  return false;
}

export async function deleteSpendFromDb(entryId: string): Promise<boolean> {
  if (neonSql) {
    try {
      await neonSql`DELETE FROM spends WHERE id = ${entryId}`;
      return true;
    } catch (e) {
      console.error("Neon DB deleteSpend error:", e);
      return false;
    }
  }

  if (supabase) {
    try {
      const { error } = await supabase.from("spends").delete().eq("id", entryId);
      return !error;
    } catch (e) {
      console.error("Supabase deleteSpend error:", e);
      return false;
    }
  }

  return false;
}

export async function fetchIncomesFromDb(selectedMonth: string): Promise<IncomeSource[]> {
  if (neonSql) {
    try {
      const rows = (await neonSql`
        SELECT id, month, name, amount, expected_date, status
        FROM incomes
        WHERE month = ${selectedMonth}
      `) as any[];
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        amount: Number(row.amount),
        expectedDate: row.expected_date,
        status: row.status as "expected" | "received",
      }));
    } catch (e) {
      console.error("Neon DB fetchIncomes error:", e);
      return [];
    }
  }

  if (supabase) {
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
      console.error("Supabase fetchIncomes error:", e);
      return [];
    }
  }

  return [];
}

export async function saveIncomeToDb(source: IncomeSource, selectedMonth: string): Promise<boolean> {
  if (neonSql) {
    try {
      await neonSql`
        INSERT INTO incomes (id, month, name, amount, expected_date, status)
        VALUES (${source.id}, ${selectedMonth}, ${source.name}, ${source.amount}, ${source.expectedDate}, ${source.status})
        ON CONFLICT (id) DO UPDATE SET
          month = EXCLUDED.month,
          name = EXCLUDED.name,
          amount = EXCLUDED.amount,
          expected_date = EXCLUDED.expected_date,
          status = EXCLUDED.status;
      `;
      return true;
    } catch (e) {
      console.error("Neon DB saveIncome error:", e);
      return false;
    }
  }

  if (supabase) {
    try {
      const { error } = await supabase.from("incomes").upsert({
        id: source.id,
        month: selectedMonth,
        name: source.name,
        amount: source.amount,
        expected_date: source.expectedDate,
        status: source.status,
      });
      return !error;
    } catch (e) {
      console.error("Supabase saveIncome error:", e);
      return false;
    }
  }

  return false;
}

export async function deleteIncomeFromDb(incomeId: string): Promise<boolean> {
  if (neonSql) {
    try {
      await neonSql`DELETE FROM incomes WHERE id = ${incomeId}`;
      return true;
    } catch (e) {
      console.error("Neon DB deleteIncome error:", e);
      return false;
    }
  }

  if (supabase) {
    try {
      const { error } = await supabase.from("incomes").delete().eq("id", incomeId);
      return !error;
    } catch (e) {
      console.error("Supabase deleteIncome error:", e);
      return false;
    }
  }

  return false;
}
