import LeftNav from "@/components/ElysiumAtlas/LeftNav";
import TopNav from "@/components/ElysiumAtlas/TopNav";
import AiSocketListener from "@/components/AiSocketListener";
import PageContent from "@/components/ElysiumAtlas/PageContent";
import BuildNewAgent from "@/components/ElysiumAtlas/BuildNewAgent";
import BuildAgentAccessGuard from "@/components/ElysiumAtlas/BuildAgentAccessGuard";

export default function MyAgentsPage() {
  return (
    <>
      <AiSocketListener />
      <TopNav />

      <LeftNav />

      <PageContent>
        <div className="lg:px-[300px] md:px-8 px-4  h-[calc(100dvh-65px)]">
          <BuildAgentAccessGuard>
            <BuildNewAgent />
          </BuildAgentAccessGuard>
        </div>
      </PageContent>
    </>
  );
}
