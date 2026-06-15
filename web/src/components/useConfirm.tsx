import { useCallback, useRef, useState } from 'react';
import ConfirmDialog, { type ConfirmOptions } from './ConfirmDialog';

/**
 * Hook que expone un confirm() basado en promesas y el elemento del diálogo.
 *
 *   const { confirm, dialog } = useConfirm();
 *   ...
 *   if (await confirm({ title, message })) { ... }
 *   return <>{dialog}{/* resto * /}</>
 */
export function useConfirm() {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: '',
    message: '',
  });
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOpen(false);
  }, []);

  const dialog = (
    <ConfirmDialog
      open={open}
      options={options}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  );

  return { confirm, dialog };
}
