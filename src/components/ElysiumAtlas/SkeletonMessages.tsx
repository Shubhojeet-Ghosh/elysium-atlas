const SkeletonMessages = () => (
  <div className="pl-[18px] pr-[16px] font-[600] py-4 space-y-6">
    <div className="flex gap-3 flex-row-reverse">
      <div className="flex-1 space-y-1 text-right">
        <div className="inline-block rounded-2xl px-[14px] py-[12px] bg-gray-200 animate-pulse h-8 w-32"></div>
      </div>
    </div>
    <div className="flex gap-3">
      <div className="flex-1 space-y-1">
        <div className="text-[13px] text-gray-600 leading-relaxed">
          <div className="bg-gray-200 animate-pulse h-8 w-5/9 mb-2 rounded-2xl"></div>
          <div className="bg-gray-200 animate-pulse h-8 w-5/6 mb-2 rounded-2xl"></div>
        </div>
      </div>
    </div>
    <div className="flex gap-3 flex-row-reverse">
      <div className="flex-1 space-y-1 text-right">
        <div className="inline-block rounded-2xl px-[14px] py-[12px] bg-gray-200 animate-pulse h-8 w-24"></div>
      </div>
    </div>
    <div className="flex gap-3 flex-row-reverse">
      <div className="flex-1 space-y-1 text-right">
        <div className="inline-block rounded-2xl px-[14px] py-[12px] bg-gray-200 animate-pulse h-8 w-32"></div>
      </div>
    </div>
    <div className="flex gap-3">
      <div className="flex-1 space-y-1">
        <div className="text-[13px] text-gray-600 leading-relaxed">
          <div className="bg-gray-200 animate-pulse h-8 w-full mb-2 rounded-2xl"></div>
          <div className="bg-gray-200 animate-pulse h-8 w-5/8 mb-2 rounded-2xl"></div>
        </div>
      </div>
    </div>
  </div>
);

export default SkeletonMessages;
