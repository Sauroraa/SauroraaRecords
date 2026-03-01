export type ReleaseItem = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  price: number | string;
  type: "FREE" | "PAID";
  audioPath: string;
  coverPath?: string | null;
  artist?: {
    id: string;
    user?: {
      email?: string;
    };
  };
};

export type RevenueSeries = {
  month: string;
  gross: number;
  net: number;
  label: number;
};
