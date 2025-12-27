import LeftNav from "@/components/ElysiumAtlas/LeftNav";
import TopNav from "@/components/ElysiumAtlas/TopNav";
import AiSocketListener from "@/components/AiSocketListener";
import PageContent from "@/components/ElysiumAtlas/PageContent";

import BuildAgent from "@/components/ElysiumAtlas/BuildAgent";
import MyAgents from "@/components/ElysiumAtlas/MyAgents";

export default function MyAgentsPage() {
  return (
    <>
      <AiSocketListener />
      <TopNav />

      <LeftNav />

      <PageContent className="">
        <div className="lg:px-[50px] px-4 mt-[80px]">
          <MyAgents />
        </div>
        <div className="px-4 md:px-8 lg:px-[300px] mt-[100px] md:mt-16 lg:mt-[120px]">
          <div className="mt-[100px] md:mt-16 lg:mt-[120px]">
            <BuildAgent />
          </div>
        </div>
      </PageContent>
    </>
  );
}
