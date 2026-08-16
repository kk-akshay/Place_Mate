"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  Search,
  X,
} from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PROFILE_SELECTOR_OPEN_EVENT =
  "place-mate:profile-selector-open";

type InlineMultiSelectProps = {
  values: string[];
  onChange: (values: string[]) => void;
  options: readonly string[];
  placeholder: string;
  searchPlaceholder?: string;
  maxSelections?: number;
  allowCustom?: boolean;
};

export function InlineMultiSelect({
  values,
  onChange,
  options,
  placeholder,
  searchPlaceholder = "Search or type...",
  maxSelections = 10,
  allowCustom = true,
}: InlineMultiSelectProps) {
  const selectorId = useId();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const searchRef = useRef<HTMLInputElement>(null);

  const normalizedSearch = search.trim();

  const filteredOptions = useMemo(() => {
    if (!normalizedSearch) {
      return [...options];
    }

    const loweredSearch =
      normalizedSearch.toLowerCase();

    return options.filter((option) =>
      option
        .toLowerCase()
        .includes(loweredSearch)
    );
  }, [
    normalizedSearch,
    options,
  ]);

  const exactMatch = useMemo(() => {
    if (!normalizedSearch) {
      return false;
    }

    return [
      ...options,
      ...values,
    ].some(
      (option) =>
        option
          .toLowerCase()
        === normalizedSearch.toLowerCase()
    );
  }, [
    normalizedSearch,
    options,
    values,
  ]);

  const limitReached =
    values.length >= maxSelections;

  useEffect(() => {
    function handleSelectorOpen(
      event: Event,
    ) {
      const customEvent =
        event as CustomEvent<string>;

      if (
        customEvent.detail
        === selectorId
      ) {
        return;
      }

      setOpen(false);
      setSearch("");
    }

    window.addEventListener(
      PROFILE_SELECTOR_OPEN_EVENT,
      handleSelectorOpen,
    );

    return () => {
      window.removeEventListener(
        PROFILE_SELECTOR_OPEN_EVENT,
        handleSelectorOpen,
      );
    };
  }, [
    selectorId,
  ]);

  function closePanel() {
    setOpen(false);
    setSearch("");
  }

  function openPanel() {
    window.dispatchEvent(
      new CustomEvent<string>(
        PROFILE_SELECTOR_OPEN_EVENT,
        {
          detail: selectorId,
        },
      )
    );

    setOpen(true);

    window.setTimeout(() => {
      searchRef.current?.focus();
    }, 0);
  }

  function toggleOpen() {
    if (open) {
      closePanel();
      return;
    }

    openPanel();
  }

  function isSelected(
    option: string,
  ) {
    return values.some(
      (value) =>
        value.toLowerCase()
        === option.toLowerCase()
    );
  }

  function toggleValue(
    option: string,
  ) {
    if (
      isSelected(option)
    ) {
      onChange(
        values.filter(
          (value) =>
            value.toLowerCase()
            !== option.toLowerCase()
        )
      );

      return;
    }

    if (limitReached) {
      return;
    }

    onChange([
      ...values,
      option,
    ]);

    setSearch("");
  }

  function removeValue(
    option: string,
  ) {
    onChange(
      values.filter(
        (value) =>
          value !== option
      )
    );
  }

  function addCustom() {
    if (
      !normalizedSearch
      || exactMatch
      || limitReached
    ) {
      return;
    }

    onChange([
      ...values,
      normalizedSearch,
    ]);

    setSearch("");
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        data-profile-field="true"
        aria-expanded={open}
        onClick={toggleOpen}
        className={cn(
          "h-11 w-full justify-between rounded-xl",
          "bg-background px-3 font-normal",
          open && "border-primary/50"
        )}
      >
        <span
          className={cn(
            "truncate text-left",
            values.length === 0
              && "text-muted-foreground"
          )}
        >
          {values.length > 0
            ? `${values.length} selected`
            : placeholder}
        </span>

        {open ? (
          <ChevronUp
            className="size-4 shrink-0 opacity-60"
            aria-hidden="true"
          />
        ) : (
          <ChevronDown
            className="size-4 shrink-0 opacity-60"
            aria-hidden="true"
          />
        )}
      </Button>

      {values.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <Badge
              key={value}
              variant="secondary"
              className="gap-1 rounded-lg px-2.5 py-1.5"
            >
              <span>
                {value}
              </span>

              <button
                type="button"
                onClick={() => {
                  removeValue(value);
                }}
                className={cn(
                  "ml-0.5 rounded p-0.5",
                  "opacity-60",
                  "transition-opacity",
                  "hover:opacity-100",
                  "focus:outline-none",
                  "focus-visible:ring-2",
                  "focus-visible:ring-ring"
                )}
                aria-label={
                  `Remove ${value}`
                }
              >
                <X
                  className="size-3"
                  aria-hidden="true"
                />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}

      {open ? (
        <div
          className={cn(
            "overflow-hidden rounded-xl",
            "border border-border/70",
            "bg-card shadow-sm"
          )}
        >
          <div className="p-2">
            <div
              className={cn(
                "flex h-10 items-center gap-2 rounded-lg",
                "border border-border/70",
                "bg-muted/30 px-3",
                "transition-colors",
                "focus-within:border-primary/50",
                "focus-within:bg-background",
                "focus-within:ring-2",
                "focus-within:ring-primary/10"
              )}
            >
              <Search
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />

              <input
                ref={searchRef}
                value={search}
                type="text"
                autoComplete="off"
                onChange={(event) => {
                  setSearch(
                    event.target.value
                  );
                }}
                onKeyDown={(event) => {
                  if (
                    event.key
                    === "Escape"
                  ) {
                    event.preventDefault();
                    closePanel();
                    return;
                  }

                  if (
                    event.key
                    !== "Enter"
                  ) {
                    return;
                  }

                  event.preventDefault();

                  if (
                    filteredOptions.length
                    > 0
                  ) {
                    toggleValue(
                      filteredOptions[0]
                    );

                    return;
                  }

                  addCustom();
                }}
                placeholder={
                  searchPlaceholder
                }
                className={cn(
                  "h-full min-w-0 flex-1",
                  "border-0 bg-transparent",
                  "text-sm outline-none",
                  "placeholder:text-muted-foreground"
                )}
              />
            </div>
          </div>

          <div
            className={cn(
              "max-h-60 overflow-y-auto",
              "overscroll-contain",
              "border-t border-border/50",
              "py-1"
            )}
          >
            {filteredOptions.map(
              (option) => {
                const selected =
                  isSelected(option);

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      toggleValue(
                        option
                      );
                    }}
                    className={cn(
                      "flex min-h-10 w-full",
                      "items-center gap-3",
                      "px-3 py-2",
                      "text-left text-sm",
                      "transition-colors",
                      "hover:bg-accent",
                      "hover:text-accent-foreground",
                      selected
                        && [
                          "bg-primary/10",
                          "font-medium",
                          "text-primary",
                        ]
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-5 shrink-0",
                        "items-center justify-center",
                        "rounded-md border",
                        selected
                          ? [
                            "border-primary",
                            "bg-primary",
                            "text-primary-foreground",
                          ]
                          : "border-border"
                      )}
                    >
                      {selected ? (
                        <Check
                          className="size-3"
                          aria-hidden="true"
                        />
                      ) : null}
                    </span>

                    <span>
                      {option}
                    </span>
                  </button>
                );
              }
            )}

            {filteredOptions.length
              === 0 ? (
              <div
                className={cn(
                  "px-4 py-5",
                  "text-center text-sm",
                  "text-muted-foreground"
                )}
              >
                No matching option found.
              </div>
            ) : null}

            {allowCustom
              && normalizedSearch
              && !exactMatch ? (
              <div
                className={cn(
                  "border-t",
                  "border-border/50",
                  "p-1"
                )}
              >
                <button
                  type="button"
                  disabled={limitReached}
                  onClick={addCustom}
                  className={cn(
                    "flex w-full items-center",
                    "gap-3 rounded-lg",
                    "px-3 py-2.5",
                    "text-left text-sm",
                    "transition-colors",
                    "hover:bg-accent",
                    "disabled:cursor-not-allowed",
                    "disabled:opacity-50"
                  )}
                >
                  <Plus
                    className="size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />

                  <span>
                    Add{" "}
                    <strong>
                      &quot;
                      {normalizedSearch}
                      &quot;
                    </strong>
                  </span>
                </button>
              </div>
            ) : null}
          </div>

          <div
            className={cn(
              "flex items-center",
              "justify-between",
              "border-t border-border/60",
              "bg-muted/20",
              "px-3 py-2"
            )}
          >
            <span className="text-xs text-muted-foreground">
              {values.length}
              /
              {maxSelections}
              {" "}
              selected
            </span>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={closePanel}
              className="h-8 rounded-lg"
            >
              Done
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}