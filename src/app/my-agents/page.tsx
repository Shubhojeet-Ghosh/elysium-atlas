import LeftNav from "@/components/ElysiumAtlas/LeftNav";
import TopNav from "@/components/ElysiumAtlas/TopNav";

export default function MyAgentsPage() {
  return (
    <>
      <TopNav />
      <div className="flex flex-row w-full h-dvh bg-pure-mist dark:bg-deep-onyx">
        <div className="flex flex-col h-full z-20">
          <LeftNav />
        </div>
      </div>
    </>
  );
}
