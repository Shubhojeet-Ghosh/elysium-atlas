"use client";
import { PanelRightOpen, AlignStartVertical } from "lucide-react";
import Logo from "@/components/ElysiumAtlas/LogoComponent";
import ThemeToggle from "@/components/ElysiumAtlas/ThemeToggle";
import NavItems from "@/components/ElysiumAtlas/NavItems";
import { useDispatch, useSelector } from "react-redux";
import { toggleLeftNav } from "@/store/reducers/settingsSlice";
import { RootState } from "@/store";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

export default function LeftNav() {
  const dispatch = useDispatch();
  const isOpen = useSelector(
    (state: RootState) => state.settings.isLeftNavOpen
  );

  const toggleNav = () => {
    dispatch(toggleLeftNav());
  };

  return (
    <div className="fixed top-0 left-0 z-[100]">
      <div className="relative group">
        <div
          className={`bg-white dark:bg-black flex flex-col items-center justify-between h-dvh transition-all duration-300 
            px-4 py-2.5 border-r-2 border-gray-300 dark:border-gray-300 hover:border-serene-purple dark:hover:border-serene-purple
            ${isOpen ? "translate-x-0" : "-translate-x-full"}
            ${isOpen ? "w-[280px]" : "w-0 lg:w-20 overflow-hidden"}
            lg:translate-x-0`}
        >
          {/* Mobile Logo with Close Button - always visible on mobile to prevent layout shift */}
          <div className="w-full flex lg:hidden justify-between items-center px-0.5 ">
            <Logo showMiniature={true} />

            <Tooltip>
              <TooltipTrigger asChild>
                <PanelRightOpen
                  className="w-5 h-5 text-serene-purple mt-[1px] hover:bg-serene-purple hover:text-white dark:hover:bg-serene-purple dark:hover:text-white transition-all duration-200 cursor-pointer"
                  onClick={toggleNav}
                />
              </TooltipTrigger>
              <TooltipContent side="right">Close navigation</TooltipContent>
            </Tooltip>
          </div>
          {/* Desktop Logo/Icon - show AlignStartVertical when closed, Logo with PanelRightOpen when open */}
          <div className="hidden lg:block w-full h-15">
            {isOpen ? (
              <div className="w-full h-full flex justify-between items-center px-0.5">
                <Logo showMiniature={false} />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PanelRightOpen
                      className="text-serene-purple transition-all duration-200 cursor-pointer hover:opacity-80 flex items-center justify-center w-5 h-5  mt-1.5"
                      onClick={toggleNav}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="right">Close navigation</TooltipContent>
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

          {/* Navigation Items */}
          <div className="flex-1 w-full overflow-y-auto">
            <NavItems isCollapsed={!isOpen} />
          </div>

          <ThemeToggle showIcon={false} />
        </div>
      </div>
      {/* Mobile: Show AlignStartVertical icon when closed, positioned exactly where Logo appears when open */}
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
  );
}
