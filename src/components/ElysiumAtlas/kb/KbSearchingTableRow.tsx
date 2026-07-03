import { TableCell, TableRow } from "@/components/ui/table";
import Spinner from "@/components/ui/Spinner";

interface KbSearchingTableRowProps {
  colSpan: number;
  query: string;
}

export default function KbSearchingTableRow({
  colSpan,
  query,
}: KbSearchingTableRowProps) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="py-10 text-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="border-serene-purple dark:border-pure-mist" />
          <p className="text-[12px] text-gray-500 dark:text-gray-400">
            Searching &apos;{query}&apos;
          </p>
        </div>
      </TableCell>
    </TableRow>
  );
}
