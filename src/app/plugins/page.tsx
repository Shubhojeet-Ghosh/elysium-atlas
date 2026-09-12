import LeftNav from "@/components/ElysiumAtlas/LeftNav";
import TopNav from "@/components/ElysiumAtlas/TopNav";
import AiSocketListener from "@/components/AiSocketListener";
import PageContent from "@/components/ElysiumAtlas/PageContent";
import TeamPlugins from "@/components/ElysiumAtlas/TeamPlugins";

export default function PluginsPage() {
  return (
    <>
      <AiSocketListener />
      <TopNav />
      <LeftNav />
      <PageContent className="">
        <div className="lg:px-[50px] px-4 mt-[80px]">
          <TeamPlugins />
        </div>
      </PageContent>
    </>
  );
}
