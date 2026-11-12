import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Eye,
  EyeOff,
  GripVertical,
  MousePointerClick,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useFetcher } from "react-router";

import { Button } from "@/components/ui/button";
import { StatusBadge, type BadgeStatus } from "@/components/status-badge";
import { cn } from "@/lib/utils";

export type AdminLink = {
  id: string;
  title: string;
  url: string;
  imageUrl: string | null;
  status: BadgeStatus;
  enabled: boolean;
  clickCount: number;
  startsAtLabel: string | null;
  expiresAtLabel: string | null;
};

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function SortableRow({ item }: { item: AdminLink }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const toggleFetcher = useFetcher();
  const deleteFetcher = useFetcher();

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "flex items-center gap-2 rounded-xl border bg-white p-2.5 shadow-xs sm:gap-3 sm:p-3",
        isDragging && "relative z-30 shadow-lg ring-2 ring-slate-900/10",
        deleteFetcher.state !== "idle" && "opacity-50"
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing"
        aria-label={`Reorder ${item.title}`}
      >
        <GripVertical className="size-4" />
      </button>

      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt=""
          width={48}
          height={48}
          className="size-12 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="size-12 shrink-0 rounded-lg bg-slate-100" />
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">
          {item.title}
        </p>
        <p className="truncate text-xs text-slate-500">{hostname(item.url)}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <StatusBadge status={item.status} />
          {item.startsAtLabel ? (
            <span className="text-[11px] text-slate-500">
              Starts {item.startsAtLabel}
            </span>
          ) : null}
          {item.expiresAtLabel ? (
            <span className="text-[11px] text-slate-500">
              Ends {item.expiresAtLabel}
            </span>
          ) : null}
        </div>
      </div>

      <span
        className="hidden shrink-0 items-center gap-1 text-xs text-slate-500 sm:flex"
        title={`${item.clickCount} clicks`}
      >
        <MousePointerClick className="size-3.5" />
        {item.clickCount.toLocaleString("en-ZA")}
      </span>

      <div className="flex shrink-0 items-center gap-0.5">
        <toggleFetcher.Form method="post">
          <input type="hidden" name="_action" value="toggle" />
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="enabled" value={String(!item.enabled)} />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="size-8"
            title={item.enabled ? "Hide from page" : "Show on page"}
            disabled={toggleFetcher.state !== "idle"}
          >
            {item.enabled ? (
              <Eye className="size-4" />
            ) : (
              <EyeOff className="size-4 text-slate-400" />
            )}
          </Button>
        </toggleFetcher.Form>

        <Button asChild variant="ghost" size="icon" className="size-8">
          <Link
            to={`/admin/links/${item.id}`}
            title="Edit"
            aria-label={`Edit ${item.title}`}
          >
            <Pencil className="size-4" />
          </Link>
        </Button>

        <deleteFetcher.Form
          method="post"
          onSubmit={(event) => {
            if (
              !window.confirm(`Delete "${item.title}"? This cannot be undone.`)
            ) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="_action" value="delete" />
          <input type="hidden" name="id" value={item.id} />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="size-8 text-slate-400 hover:text-red-600"
            title="Delete"
            disabled={deleteFetcher.state !== "idle"}
          >
            <Trash2 className="size-4" />
          </Button>
        </deleteFetcher.Form>
      </div>
    </li>
  );
}

export function SortableLinkList({ links }: { links: AdminLink[] }) {
  const [items, setItems] = useState(links);
  const reorderFetcher = useFetcher();

  // Fresh loader data (after a save or revalidation) wins.
  useEffect(() => {
    setItems(links);
  }, [links]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);

    reorderFetcher.submit(
      {
        _action: "reorder",
        ids: JSON.stringify(next.map((item) => item.id)),
      },
      { method: "post" }
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-white px-6 py-14 text-center">
        <h2 className="text-base font-semibold text-slate-900">No links yet</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
          Add your first link with an image and a title. You can schedule it for
          later or give it an end date so it hides itself.
        </p>
        <Button asChild className="mt-5">
          <Link to="/admin/links/new">
            <Plus className="mr-2 size-4" />
            Add a link
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-xs text-slate-500">
          Drag the handle to change the order.
        </p>
        {reorderFetcher.state !== "idle" ? (
          <p className="text-xs text-slate-400">Saving order…</p>
        ) : null}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <SortableRow key={item.id} item={item} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
