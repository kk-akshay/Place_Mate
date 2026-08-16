"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  Search,
} from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PROFILE_SELECTOR_OPEN_EVENT =
  "place-mate:profile-selector-open";

type InlineSearchSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder: string;
  searchPlaceholder?: string;
  allowCustom?: boolean;
};

export function InlineSearchSelect({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder = "Search...",
  allowCustom = true,
}: InlineSearchSelectProps) {
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
      value,
    ].some(
      (option) =>
        option
          .toLowerCase()
          === normalizedSearch.toLowerCase()
    );
  }, [
    normalizedSearch,
    options,
    value,
  ]);

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

  function selectValue(
    nextValue: string,
  ) {
    onChange(nextValue);
    closePanel();
  }

  return (
    <div className="w-full">
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
            !value
              && "text-muted-foreground"
          )}
        >
          {value || placeholder}
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

      {open ? (
        <div
          className={cn(
            "mt-2 overflow-hidden rounded-xl",
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
                    selectValue(
                      filteredOptions[0]
                    );
                    return;
                  }

                  if (
                    allowCustom
                    && normalizedSearch
                  ) {
                    selectValue(
                      normalizedSearch
                    );
                  }
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
                  value === option;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      selectValue(
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
                        "items-center justify-center"
                      )}
                    >
                      {selected ? (
                        <Check
                          className="size-4"
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
                  onClick={() => {
                    selectValue(
                      normalizedSearch
                    );
                  }}
                  className={cn(
                    "flex w-full items-center",
                    "gap-3 rounded-lg",
                    "px-3 py-2.5",
                    "text-left text-sm",
                    "transition-colors",
                    "hover:bg-accent"
                  )}
                >
                  <Plus
                    className="size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />

                  <span>
                    Use{" "}
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
        </div>
      ) : null}
    </div>
  );
}