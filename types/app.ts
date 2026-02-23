export type MarketStatus = "open" | "closed" | "resolved";
export type MarketSide = "yes" | "no";

export type MarketRow = {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  category: string;
  source_link: string | null;
  close_date: string;
  status: MarketStatus;
  resolved_outcome: MarketSide | null;
  created_at: string;
};

export type MarketPoolRow = {
  market_id: string;
  yes_pool: number;
  no_pool: number;
  total_pool: number;
  bet_count: number;
  participant_count: number;
};
