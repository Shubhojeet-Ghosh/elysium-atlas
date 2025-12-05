import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-pure-mist text-deep-onyx font-sans flex-col">
      <div>Hello, From Shubh,</div>
      <div className="flex gap-2 flex-col">
        <p className="mt-[16px]">Color Palettes...</p>
        <div className="flex gap-2">
          <button className="text-[14px] cursor-pointer mt-[6px] bg-serene-purple text-pure-mist px-4 py-3 rounded-md">
            serene-purple
          </button>
          <button className="text-[14px] cursor-pointer font-medium mt-[6px] border border-serene-purple text-serene-purple px-4 py-3 rounded-md">
            serene-purple-border
          </button>
          <button className="text-[14px] cursor-pointer font-bold mt-[6px] bg-pure-mist text-deep-onyx px-4 py-3 rounded-md">
            pure-mist
          </button>
          <button className="text-[14px] cursor-pointer font-bold mt-[6px] bg-deep-onyx text-white px-4 py-3 rounded-md">
            deep-onyx
          </button>
          <button className="text-[14px] cursor-pointer font-bold mt-[6px] bg-teal-green text-white px-4 py-3 rounded-md">
            teal-green
          </button>
          <button className="text-[14px] cursor-pointer font-medium mt-[6px] border border-teal-green text-teal-green px-4 py-3 rounded-md">
            teal-green-border
          </button>
        </div>
      </div>
    </div>
  );
}
