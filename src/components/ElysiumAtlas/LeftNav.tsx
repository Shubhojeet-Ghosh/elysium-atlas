"use client";
import { PanelRightOpen, AlignStartVertical } from "lucide-react";
import { usePathname } from "next/navigation";
import NProgress from "nprogress";
import Logo from "@/components/ElysiumAtlas/LogoComponent";
import ThemeToggle from "@/components/ElysiumAtlas/ThemeToggle";
import NavItems from "@/components/ElysiumAtlas/NavItems";
import AgentNavItems from "@/components/ElysiumAtlas/AgentNavItems";
import { useDispatch, useSelector } from "react-redux";
import { setLeftNavOpen, toggleLeftNav } from "@/store/reducers/settingsSlice";
import { RootState } from "@/store";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

function isAgentDetailPage(pathname: string) {
  return /^\/my-agents\/(?!build$)[^/]+$/.test(pathname);
}

function isMobileScreen() {
  return window.matchMedia("(max-width: 1023px)").matches;
}

export default function LeftNav() {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const isOpen = useSelector(
    (state: RootState) => state.settings.isLeftNavOpen,
  );
  const showAgentNav = isAgentDetailPage(pathname);

  const toggleNav = () => {
    dispatch(toggleLeftNav());
  };

  const closeNav = () => {
    dispatch(setLeftNavOpen(false));
  };

  const closeNavIfMobile = () => {
    if (isMobileScreen()) {
      closeNav();
    }
  };

  const handleNavigate = () => {
    NProgress.start();
    closeNavIfMobile();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[99] bg-black/50 dark:bg-black/70 backdrop-blur-[2px] lg:hidden"
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
            className={`bg-white dark:bg-black flex flex-col items-center justify-between h-dvh transition-all duration-300 
            px-4 py-2.5 lg:border-r-2 lg:border-gray-300 lg:dark:border-gray-300 lg:hover:border-serene-purple lg:dark:hover:border-serene-purple
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

            {/* Navigation Items */}
            <div className="flex-1 w-full overflow-y-auto">
              {showAgentNav ? (
                <AgentNavItems
                  isCollapsed={!isOpen}
                  onNavigate={handleNavigate}
                  onCloseNav={closeNavIfMobile}
                />
              ) : (
                <NavItems
                  isCollapsed={!isOpen}
                  onNavigate={handleNavigate}
                  onCloseNav={closeNavIfMobile}
                />
              )}
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
    </>
  );
}
