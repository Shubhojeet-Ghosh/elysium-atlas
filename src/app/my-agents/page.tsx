import LeftNav from "@/components/ElysiumAtlas/LeftNav";
import TopNav from "@/components/ElysiumAtlas/TopNav";
import AiSocketListener from "@/components/AiSocketListener";
import PageContent from "@/components/ElysiumAtlas/PageContent";

export default function MyAgentsPage() {
  return (
    <>
      <AiSocketListener />
      <TopNav />

      <LeftNav />

      <PageContent>
        <div className="w-full h-full">Hello World</div>
      </PageContent>
    </>
  );
}
