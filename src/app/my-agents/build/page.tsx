import LeftNav from "@/components/ElysiumAtlas/LeftNav";
import TopNav from "@/components/ElysiumAtlas/TopNav";
import AiSocketListener from "@/components/AiSocketListener";
import PageContent from "@/components/ElysiumAtlas/PageContent";
import BuildNewAgent from "@/components/ElysiumAtlas/BuildNewAgent";

export default function MyAgentsPage() {
  return (
    <>
      <AiSocketListener />
      <TopNav />

      <LeftNav />

      <PageContent className="mt-[100px] md:mt-16 lg:mt-[120px]">
        <div className="px-4 md:px-8 lg:px-[300px]">
          <div className="mt-[100px] md:mt-16 lg:mt-[120px]">
            <BuildNewAgent />
          </div>
        </div>
      </PageContent>
    </>
  );
}
