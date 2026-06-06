"use client";

import { PanelRightOpen, AlignStartVertical } from "lucide-react";
import EmailLogo from "@/components/ElysiumAtlas/email/EmailLogo";
import EmailNavItems from "@/components/ElysiumAtlas/email/EmailNavItems";
import { useAppDispatch, useAppSelector } from "@/store";
import { setLeftNavOpen, toggleLeftNav } from "@/store/reducers/settingsSlice";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

export default function EmailLeftNav() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.settings.isLeftNavOpen);

  const toggleNav = () => {
    dispatch(toggleLeftNav());
  };

  const closeNav = () => {
    dispatch(setLeftNavOpen(false));
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[99] bg-black/50 backdrop-blur-[2px] lg:hidden"
          onClick={closeNav}
          aria-hidden="true"
        />
      )}
      <div
        className={`fixed top-0 left-0 z-[100] transition-all duration-300 ${
          !isOpen ? "w-0 lg:w-20" : "w-[280px]"
        }`}
      >
        <div className="relative group h-full">
          <div
            className={`bg-white flex flex-col items-center justify-between h-dvh transition-all duration-300 
            px-4 py-2.5 lg:border-r-2 lg:border-gray-300 lg:hover:border-serene-purple
            ${isOpen ? "translate-x-0" : "-translate-x-full"}
            ${isOpen ? "w-[280px]" : "w-0 lg:w-20 overflow-hidden"}
            lg:translate-x-0`}
          >
            <div className="w-full flex lg:hidden justify-between items-center px-0.5">
              <EmailLogo href="/email/ai-agents" imageClassName="h-8 w-auto" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <PanelRightOpen
                    className="w-5 h-5 text-serene-purple mt-[1px] hover:bg-serene-purple hover:text-white transition-all duration-200 cursor-pointer"
                    onClick={toggleNav}
                  />
                </TooltipTrigger>
                <TooltipContent side="right">Close navigation</TooltipContent>
              </Tooltip>
            </div>

            <div className="hidden lg:block w-full h-15">
              {isOpen ? (
                <div className="w-full h-full flex justify-between items-center px-0.5">
                  <EmailLogo
                    href="/email/ai-agents"
                    imageClassName="h-10 w-auto"
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PanelRightOpen
                        className="text-serene-purple transition-all duration-200 cursor-pointer hover:opacity-80 flex items-center justify-center w-5 h-5 mt-1.5"
                        onClick={toggleNav}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      Close navigation
                    </TooltipContent>
                  </Tooltip>
                </div>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={toggleNav}
                      className="text-serene-purple transition-all duration-200 cursor-pointer hover:opacity-80 flex items-center justify-center w-full h-full"
                      aria-label="Open navigation"
                    >
                      <AlignStartVertical className="w-6 h-6" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Open navigation</TooltipContent>
                </Tooltip>
              )}
            </div>

            <div className="flex-1 w-full overflow-y-auto">
              <EmailNavItems isCollapsed={!isOpen} />
            </div>
          </div>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleNav}
              className={`fixed z-[100] text-serene-purple transition-all duration-200 cursor-pointer hover:opacity-80 flex items-center left-4 top-5 ${
                !isOpen ? "block lg:hidden" : "hidden"
              }`}
              aria-label="Open navigation"
            >
              <AlignStartVertical className="w-6 h-6" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Open navigation</TooltipContent>
        </Tooltip>
      </div>
    </>
  );
}
