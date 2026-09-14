import Link from "next/link";
import { cityTradeBoard, foundingBoardCopy } from "@/lib/service-business/agency-model";

export function FoundingBoardNote({
  cityName,
  tradeLabel,
  seated,
}: {
  cityName: string;
  tradeLabel: string;
  seated: number;
}) {
  const board = cityTradeBoard(seated);
  return (
    <div className="mt-6 max-w-xl rounded-2xl border border-border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">{board.open ? "Board open" : "Founding board"}</p>
      <p className="mt-2 text-sm leading-6 text-foreground">{foundingBoardCopy(cityName, tradeLabel, board)}</p>
      {board.open ? null : (
        <p className="mt-3 text-sm text-muted-foreground">
          <Link href="/agency/start" className="underline">
            Sit as one of the first three
          </Link>
          {" · "}
          {board.seatsToOpen} seat{board.seatsToOpen === 1 ? "" : "s"} left.
        </p>
      )}
    </div>
  );
}
