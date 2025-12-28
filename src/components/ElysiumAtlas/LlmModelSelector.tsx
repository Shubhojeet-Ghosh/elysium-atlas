import { useState, useEffect } from "react";
import CustomSelector from "@/components/ui/CustomSelector";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Brain } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store";
import { setLlmModel } from "@/store/reducers/agentSlice";
import AutoComplete from "@/components/ui/AutoComplete";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { setTemperature } from "@/store/reducers/agentSlice";

export default function LlmModelSelector() {
  const [open, setOpen] = useState(false);
  const temperature = useAppSelector((state) => state.agent.temperature);
  const llmModel = useAppSelector((state) => state.agent.llmModel);
  const availableModels = useAppSelector(
    (state) => state.agent.availableModels
  );
  const dispatch = useAppDispatch();

  const modelItems = availableModels.map((model) => ({
    value: model,
    label: model,
  }));

  return (
    <>
      <div className="lg:w-[40%] w-full">
        <CustomSelector
          label="LLM Model"
          value={llmModel}
          className="px-[10px] py-[12px] "
          onClick={() => setOpen(true)}
        />
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="min-w-full lg:min-w-[480px] md:min-w-full z-[110] px-[4px]">
          <SheetHeader>
            <SheetTitle>
              <div className="flex items-center justify-start">
                <Brain className="inline mr-2" size={18} />
                <p>LLM Model</p>
              </div>
            </SheetTitle>
            <SheetDescription>
              Choose your preferred language model.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 px-4">
            <AutoComplete
              items={modelItems}
              value={llmModel}
              placeholder="Select LLM model..."
              searchPlaceholder="Search model..."
              emptyMessage="No model found."
              onChange={(value) => dispatch(setLlmModel(value))}
              className="text-[13px] font-[500]"
            />
          </div>
          <div className="mt-4 px-4">
            <label className="text-sm font-medium">Temperature</label>
            <p className="text-xs text-muted-foreground">
              Control the creativity and randomness of the responses generated
              by the LLM.
            </p>
            <div className="flex justify-between text-xs text-muted-foreground mt-[20px]">
              <span>More deterministic</span>
              <span>More expressive</span>
            </div>
            <Slider
              value={[temperature]}
              onValueChange={(value) => dispatch(setTemperature(value[0]))}
              max={1.0}
              min={0.0}
              step={0.01}
              className={cn("w-full mt-[10px] cursor-pointer")}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
