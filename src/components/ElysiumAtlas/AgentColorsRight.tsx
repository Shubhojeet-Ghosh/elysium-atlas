"use client";

import { useAppDispatch, useAppSelector } from "@/store";
import {
  setPrimaryColor,
  setSecondaryColor,
  setTextColor,
} from "@/store/reducers/agentSlice";
import ColorPickerRow from "./ColorPickerRow";

export default function AgentColorsRight() {
  const dispatch = useAppDispatch();
  const primaryColor = useAppSelector((state) => state.agent.primary_color);
  const textColor = useAppSelector((state) => state.agent.text_color);

  return (
    <div className="lg:w-[60%] w-full flex flex-col items-start lg:items-center p-[24px] gap-[20px]">
      <div className="w-full max-w-[480px] flex flex-col divide-y divide-border overflow-hidden">
        <div className="px-4 py-1">
          <ColorPickerRow
            label="Primary Color"
            value={primaryColor}
            onChange={(color) => {
              dispatch(setPrimaryColor(color));
              dispatch(setSecondaryColor(color));
            }}
          />
        </div>
        <div className="px-4 py-1">
          <ColorPickerRow
            label="Text Color"
            value={textColor}
            onChange={(color) => dispatch(setTextColor(color))}
          />
        </div>
      </div>
    </div>
  );
}
