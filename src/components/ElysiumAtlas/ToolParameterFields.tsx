"use client";

import { Plus, Trash2 } from "lucide-react";
import CustomInput from "@/components/inputs/CustomInput";
import CustomTextareaPrimary from "@/components/inputs/CustomTextareaPrimary";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ARRAY_ITEM_TYPE_OPTIONS,
  NESTED_PARAMETER_TYPE_OPTIONS,
  PARAMETER_TYPE_OPTIONS,
  createEmptyNestedParameterRow,
  normalizeNestedRowForType,
  normalizeRowForType,
} from "@/utils/toolsFormUtils";
import type {
  ToolArrayItemType,
  ToolLeafParameterType,
  ToolNestedParameterRow,
  ToolParameterRow,
  ToolParameterType,
} from "@/types/tools";

const FIELD_CLASS =
  "!h-10 !min-h-10 !max-h-10 w-full box-border !rounded-[10px] !border-2 border-gray-300 bg-white !px-[12px] !py-0 !text-[13px] !font-semibold !leading-none text-deep-onyx dark:border-deep-onyx dark:bg-deep-onyx dark:text-pure-mist";

const SELECT_TRIGGER_CLASS =
  "h-10 min-h-10 w-full cursor-pointer border-[2px] border-gray-300 dark:border-deep-onyx rounded-[10px] bg-white dark:bg-deep-onyx text-[13px] font-[600] text-deep-onyx dark:text-pure-mist shadow-none focus-visible:border-serene-purple focus-visible:ring-serene-purple/30 px-3";

function EnumValuesEditor({
  values,
  onChange,
  disabled,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}) {
  const updateValue = (index: number, value: string) => {
    const next = [...values];
    next[index] = value;
    onChange(next);
  };

  const addValue = () => onChange([...values, ""]);
  const removeValue = (index: number) =>
    onChange(values.filter((_, i) => i !== index));

  return (
    <div className="grid gap-2">
      <p className="text-[12px] font-semibold text-gray-600 dark:text-gray-300">
        Allowed values
      </p>
      {values.map((value, index) => (
        <div key={index} className="flex items-center gap-2">
          <CustomInput
            value={value}
            onChange={(e) => updateValue(index, e.target.value)}
            placeholder="celsius"
            disabled={disabled}
            className={FIELD_CLASS}
          />
          <button
            type="button"
            onClick={() => removeValue(index)}
            disabled={disabled || values.length <= 1}
            className="inline-flex items-center justify-center p-2 rounded-[8px] text-danger-red hover:bg-danger-red/10 cursor-pointer disabled:opacity-50 shrink-0"
            aria-label="Remove enum value"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addValue}
        disabled={disabled}
        className="inline-flex items-center gap-1 text-[12px] font-semibold text-serene-purple hover:text-serene-purple/80 cursor-pointer disabled:opacity-50 w-fit"
      >
        <Plus size={14} />
        Add value
      </button>
    </div>
  );
}

function NestedParameterFields({
  row,
  onChange,
  onRemove,
  disabled,
}: {
  row: ToolNestedParameterRow;
  onChange: (row: ToolNestedParameterRow) => void;
  onRemove?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-3 py-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Property
        </p>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className="inline-flex items-center justify-center p-1.5 rounded-[8px] text-danger-red hover:bg-danger-red/10 cursor-pointer disabled:opacity-50"
            aria-label="Remove property"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        <CustomInput
          value={row.name}
          onChange={(e) => onChange({ ...row, name: e.target.value })}
          placeholder="city"
          disabled={disabled}
          className={FIELD_CLASS}
        />
        <Select
          value={row.type}
          onValueChange={(value) =>
            onChange(normalizeNestedRowForType(row, value as ToolLeafParameterType))
          }
          disabled={disabled}
        >
          <SelectTrigger className={SELECT_TRIGGER_CLASS}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" className="z-[1100]">
            {NESTED_PARAMETER_TYPE_OPTIONS.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <CustomTextareaPrimary
        value={row.description}
        onChange={(e) => onChange({ ...row, description: e.target.value })}
        placeholder="Description shown to the LLM"
        rows={2}
        disabled={disabled}
        className="text-[13px]"
      />
      {row.type === "enum" && (
        <EnumValuesEditor
          values={row.enum_values ?? [""]}
          onChange={(enum_values) => onChange({ ...row, enum_values })}
          disabled={disabled}
        />
      )}
      {row.type === "array" && (
        <div className="grid gap-1.5">
          <p className="text-[12px] font-semibold text-gray-600 dark:text-gray-300">
            Item type
          </p>
          <Select
            value={row.items_type ?? "string"}
            onValueChange={(value) =>
              onChange({ ...row, items_type: value as ToolArrayItemType })
            }
            disabled={disabled}
          >
            <SelectTrigger className={SELECT_TRIGGER_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[1100]">
              {ARRAY_ITEM_TYPE_OPTIONS.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <label className="flex items-center gap-2 text-[12px] font-medium text-gray-600 dark:text-gray-300 cursor-pointer">
        <Checkbox
          checked={row.required}
          onCheckedChange={(checked) =>
            onChange({ ...row, required: checked === true })
          }
          disabled={disabled}
        />
        Required
      </label>
    </div>
  );
}

interface ToolParameterFieldsProps {
  row: ToolParameterRow;
  onChange: (row: ToolParameterRow) => void;
  onRemove?: () => void;
  disabled?: boolean;
}

export default function ToolParameterFields({
  row,
  onChange,
  onRemove,
  disabled,
}: ToolParameterFieldsProps) {
  const updateNested = (id: string, updated: ToolNestedParameterRow) => {
    onChange({
      ...row,
      properties: (row.properties ?? []).map((p) =>
        p.id === id ? updated : p,
      ),
    });
  };

  const addNested = () => {
    onChange({
      ...row,
      properties: [...(row.properties ?? []), createEmptyNestedParameterRow()],
    });
  };

  const removeNested = (id: string) => {
    onChange({
      ...row,
      properties: (row.properties ?? []).filter((p) => p.id !== id),
    });
  };

  return (
    <div className="grid gap-3 py-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] font-semibold text-gray-600 dark:text-gray-300">
          Parameter
        </p>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className="inline-flex items-center justify-center p-1.5 rounded-[8px] text-danger-red hover:bg-danger-red/10 cursor-pointer disabled:opacity-50"
            aria-label="Remove parameter"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        <CustomInput
          value={row.name}
          onChange={(e) => onChange({ ...row, name: e.target.value })}
          placeholder="order_id"
          disabled={disabled}
          className={FIELD_CLASS}
        />
        <Select
          value={row.type}
          onValueChange={(value) =>
            onChange(normalizeRowForType(row, value as ToolParameterType))
          }
          disabled={disabled}
        >
          <SelectTrigger className={SELECT_TRIGGER_CLASS}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" className="z-[1100]">
            {PARAMETER_TYPE_OPTIONS.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <CustomTextareaPrimary
        value={row.description}
        onChange={(e) => onChange({ ...row, description: e.target.value })}
        placeholder="Description shown to the LLM"
        rows={2}
        disabled={disabled}
        className="text-[13px]"
      />
      {row.type === "enum" && (
        <EnumValuesEditor
          values={row.enum_values ?? [""]}
          onChange={(enum_values) => onChange({ ...row, enum_values })}
          disabled={disabled}
        />
      )}
      {row.type === "array" && (
        <div className="grid gap-1.5">
          <p className="text-[12px] font-semibold text-gray-600 dark:text-gray-300">
            Item type
          </p>
          <Select
            value={row.items_type ?? "string"}
            onValueChange={(value) =>
              onChange({ ...row, items_type: value as ToolArrayItemType })
            }
            disabled={disabled}
          >
            <SelectTrigger className={SELECT_TRIGGER_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[1100]">
              {ARRAY_ITEM_TYPE_OPTIONS.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {row.type === "object" && (
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12px] font-semibold text-gray-600 dark:text-gray-300">
              Properties
            </p>
            <button
              type="button"
              onClick={addNested}
              disabled={disabled}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-serene-purple hover:text-serene-purple/80 cursor-pointer disabled:opacity-50"
            >
              <Plus size={14} />
              Add property
            </button>
          </div>
          {(row.properties ?? []).length > 0 && (
            <div className="divide-y divide-gray-200 dark:divide-deep-onyx">
              {(row.properties ?? []).map((nested) => (
                <NestedParameterFields
                  key={nested.id}
                  row={nested}
                  onChange={(updated) => updateNested(nested.id, updated)}
                  onRemove={() => removeNested(nested.id)}
                  disabled={disabled}
                />
              ))}
            </div>
          )}
        </div>
      )}
      <label className="flex items-center gap-2 text-[12px] font-medium text-gray-600 dark:text-gray-300 cursor-pointer">
        <Checkbox
          checked={row.required}
          onCheckedChange={(checked) =>
            onChange({ ...row, required: checked === true })
          }
          disabled={disabled}
        />
        Required
      </label>
    </div>
  );
}
