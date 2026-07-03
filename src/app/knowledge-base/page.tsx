import { Suspense } from "react";
import LeftNav from "@/components/ElysiumAtlas/LeftNav";
import TopNav from "@/components/ElysiumAtlas/TopNav";
import AiSocketListener from "@/components/AiSocketListener";
import PageContent from "@/components/ElysiumAtlas/PageContent";
import KnowledgeBase from "@/components/ElysiumAtlas/KnowledgeBase";

export default function KnowledgeBasePage() {
  return (
    <>
      <AiSocketListener />
      <TopNav />
      <LeftNav />
      <PageContent className="">
        <div className="lg:px-[50px] px-4 mt-[80px]">
          <Suspense fallback={null}>
            <KnowledgeBase />
          </Suspense>
        </div>
      </PageContent>
    </>
  );
}
