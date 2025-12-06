"use client";

import { motion } from "framer-motion";
import {
  NextJsIcon,
  ReactIcon,
  TailwindCssIcon,
  TypeScriptIcon,
  MongoDbIcon,
  MySqlIcon,
  PythonIcon,
  QdrantIcon,
  RedisIcon,
  NodeJsIcon,
  SocketIoIcon,
  GitIcon,
} from "@/components/TechStacks/Icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const animation = {
  hide: { x: -8, opacity: 0 },
  show: {
    x: 0,
    opacity: 1,
  },
};

function HeaderTechStack() {
  return (
    <div>
      <motion.p
        className="mb-[6px] text-[14px] font-[500] text-slate-600 dark:text-slate-400"
        initial={animation.hide}
        animate={animation.show}
        transition={{ delay: 0.6 }}
      >
        Tech Stack and Tools:
      </motion.p>
      <div className="overflow-x-auto pb-[5px] flex scrollbar-hide">
        <TooltipProvider delayDuration={150}>
          <motion.ul
            className="flex items-center gap-3.5 text-slate-500 dark:text-slate-500"
            initial="hide"
            animate="show"
            transition={{ delayChildren: 0.6, staggerChildren: 0.025 }}
          >
            <motion.li variants={animation}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="transition duration-200 hover:text-[#47A248] flex items-center justify-center cursor-pointer">
                    <PythonIcon className="h-6 w-6" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>Python</TooltipContent>
              </Tooltip>
            </motion.li>
            <motion.li variants={animation}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="transition duration-200 hover:text-[#47A248] flex items-center justify-center cursor-pointer">
                    <NodeJsIcon className="h-9 w-9" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>Node.js</TooltipContent>
              </Tooltip>
            </motion.li>
            <motion.li variants={animation}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="transition duration-200 hover:text-[#000000] dark:hover:text-[#FFFFFF] cursor-pointer">
                    <NextJsIcon className="h-6 w-6" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>Next.js</TooltipContent>
              </Tooltip>
            </motion.li>
            <motion.li variants={animation}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="transition duration-200 hover:text-[#61DAFB] cursor-pointer">
                    <ReactIcon className="h-6 w-6" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>React</TooltipContent>
              </Tooltip>
            </motion.li>
            <motion.li variants={animation}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="transition duration-200 hover:text-[#3178C6] cursor-pointer">
                    <TypeScriptIcon className="h-5 w-5" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>TypeScript</TooltipContent>
              </Tooltip>
            </motion.li>
            <motion.li variants={animation}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="transition duration-200 hover:text-[#06B6D4] cursor-pointer">
                    <TailwindCssIcon className="h-6 w-6" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>Tailwind CSS</TooltipContent>
              </Tooltip>
            </motion.li>

            <motion.li variants={animation}>
              <div className="h-3 w-[1px] bg-slate-300 dark:bg-slate-700" />
            </motion.li>
            <motion.li variants={animation}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="transition duration-200 flex items-center justify-center cursor-pointer ml-[-5px]">
                    <MongoDbIcon className="h-5 w-5" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>MongoDB</TooltipContent>
              </Tooltip>
            </motion.li>

            <motion.li variants={animation}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="transition duration-200 flex items-center justify-center cursor-pointer ml-[-10px]">
                    <MySqlIcon className="h-9 w-9" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>MySQL</TooltipContent>
              </Tooltip>
            </motion.li>
            <motion.li variants={animation}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="transition duration-200 flex items-center justify-center cursor-pointer ml-[-5px]">
                    <QdrantIcon className="h-5 w-5" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>Qdrant</TooltipContent>
              </Tooltip>
            </motion.li>
            <motion.li variants={animation}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="transition duration-200 flex items-center justify-center cursor-pointer ml-[5px]">
                    <RedisIcon className="h-5 w-5" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>Redis</TooltipContent>
              </Tooltip>
            </motion.li>
            <motion.li variants={animation}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="transition duration-200 flex items-center justify-center cursor-pointer ml-[5px]">
                    <SocketIoIcon className="h-5 w-5" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>Socket.io</TooltipContent>
              </Tooltip>
            </motion.li>
            <motion.li variants={animation}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="transition duration-200 flex items-center justify-center cursor-pointer">
                    <GitIcon className="h-5 w-5" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>Git</TooltipContent>
              </Tooltip>
            </motion.li>
          </motion.ul>
        </TooltipProvider>
      </div>
    </div>
  );
}

export default HeaderTechStack;
