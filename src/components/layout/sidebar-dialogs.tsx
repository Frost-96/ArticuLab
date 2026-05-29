"use client";

import type { FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SidebarType } from "./left-sidebar";

export function RenameDialog({
  open,
  title,
  itemTitle,
  isPending,
  onOpenChange,
  onTitleChange,
  onSubmit,
}: {
  open: boolean;
  title: string;
  itemTitle: string;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onTitleChange: (title: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
            <DialogDescription>
              Update the title shown in the sidebar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="sidebar-rename-title">Title</Label>
            <Input
              id="sidebar-rename-title"
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder={itemTitle || "Untitled"}
              autoFocus
              disabled={isPending}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || isPending}
              className="bg-slate-900 hover:bg-slate-800"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteDialog({
  open,
  title,
  type,
  isPending,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  title: string;
  type: SidebarType;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const noun =
    type === "coach"
      ? "conversation"
      : type === "writing"
        ? "writing session"
        : "speaking session";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {noun}?</DialogTitle>
          <DialogDescription>
            This will remove{" "}
            <span className="font-medium">{title || "Untitled"}</span> from your
            history. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
