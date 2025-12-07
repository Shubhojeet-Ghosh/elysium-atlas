import LeftNav from "@/components/ElysiumAtlas/LeftNav";
import TopNav from "@/components/ElysiumAtlas/TopNav";

export default function MyAgentsPage() {
  return (
    <>
      <div className="flex flex-row w-full h-dvh bg-pure-mist dark:bg-deep-onyx">
        <div className="flex flex-col h-full z-20">
          <LeftNav />
        </div>
        <div className="flex-1 flex justify-end z-30">
          <TopNav />
        </div>
      </div>
    </>
  );
}
