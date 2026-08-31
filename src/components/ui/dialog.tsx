'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

interface DialogProps extends React.ComponentProps<'div'> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function Dialog({ open, onOpenChange, className, ...props }: DialogProps) {
  if (!open) return null;
  return (
    <div
      data-slot="dialog"
      className={cn('fixed inset-0 z-50 flex items-center justify-center', className)}
      {...props}
    />
  );
}

function DialogTrigger({ ...props }: React.ComponentProps<'button'>) {
  return null;
}

function DialogPortal({ ...props }: React.ComponentProps<'div'>) {
  return null;
}

function DialogClose({ ...props }: React.ComponentProps<'button'>) {
  return null;
}

function DialogOverlay({ className, onClick, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-overlay"
      className={cn('fixed inset-0 z-50 bg-black/80', className)}
      onClick={() => {}}
      {...props}
    />
  );
}

function DialogContent({ className, children, ...props }: DialogProps) {
  return (
    <div
      data-slot="dialog-content"
      className={cn(
        'bg-background relative z-50 w-full max-w-lg rounded-lg border p-6 shadow-lg',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-title"
      className={cn('text-lg leading-none font-semibold', className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="dialog-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
