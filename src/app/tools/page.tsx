import LeftNav from "@/components/ElysiumAtlas/LeftNav";
import TopNav from "@/components/ElysiumAtlas/TopNav";
import AiSocketListener from "@/components/AiSocketListener";
import PageContent from "@/components/ElysiumAtlas/PageContent";
import TeamTools from "@/components/ElysiumAtlas/TeamTools";

export default function ToolsPage() {
  return (
    <>
      <AiSocketListener />
      <TopNav />
      <LeftNav />
      <PageContent className="">
        <div className="lg:px-[50px] px-4 mt-[80px]">
          <TeamTools />
        </div>
      </PageContent>
    </>
  );
}
