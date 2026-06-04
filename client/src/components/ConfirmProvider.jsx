import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const Ctx = createContext(null);
export const useConfirm = () => useContext(Ctx);

/** Wrap your app with <ConfirmProvider> once, then use useConfirm() anywhere. */
export default function ConfirmProvider({ children }) {
  const [modal, setModal] = useState(null); // { type:'confirm'|'alert'|'prompt', ... }
  const resolverRef = useRef(null);
  const inputRef = useRef(null);

  // Close & resolve helper
  const resolve = (value) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setModal(null);
  };

  const alert = useCallback((opts) =>
    new Promise((res) => { resolverRef.current = res; setModal({ type: "alert", ...opts }); })
  , []);

  const confirm = useCallback((opts) =>
    new Promise((res) => { resolverRef.current = res; setModal({ type: "confirm", ...opts }); })
  , []);

  const prompt = useCallback((opts) =>
    new Promise((res) => { resolverRef.current = res; setModal({ type: "prompt", value: opts.defaultValue || "", ...opts }); })
  , []);

  // ESC to close (cancel=false / empty)
  useEffect(() => {
    function onKey(e) {
      if (!modal) return;
      if (e.key === "Escape") resolve(modal.type === "alert" ? true : false);
      if (e.key === "Enter" && modal.type !== "alert") {
        if (modal.type === "prompt") resolve(inputRef.current?.value ?? "");
        else resolve(true);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modal]);

  // Autofocus input for prompt
  useEffect(() => {
    if (modal?.type === "prompt") setTimeout(() => inputRef.current?.focus(), 0);
  }, [modal]);

  return (
    <Ctx.Provider value={{ alert, confirm, prompt }}>
      {children}
      {modal && createPortal(
        <div
          className="fixed inset-0 z-[1000] grid place-items-center bg-black/40 backdrop-blur-sm"
          onMouseDown={() => resolve(modal.type === "alert" ? true : false)} // click backdrop = cancel (or OK for alert)
        >
          <div
            className="w-[min(92vw,460px)] rounded-2xl border border-white/20 bg-white p-5 shadow-2xl dark:bg-neutral-900"
            onMouseDown={(e) => e.stopPropagation()} // don't close when clicking inside
            role="dialog" aria-modal="true" aria-labelledby="modal-title"
          >
            <h3 id="modal-title" className="text-lg font-semibold text-neutral-900 dark:text-white">
              {modal.title || (modal.type === "alert" ? "Notice" : modal.type === "confirm" ? "Are you sure?" : "Input")}
            </h3>
            {modal.message && (
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{modal.message}</p>
            )}

            {modal.type === "prompt" && (
              <input
                ref={inputRef}
                defaultValue={modal.value}
                placeholder={modal.placeholder || "Type here..."}
                className="mt-4 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-sky-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
            )}

            <div className="mt-5 grid grid-flow-col auto-cols-max gap-2 justify-end">
              {modal.type !== "alert" && (
                <button
                  onClick={() => resolve(false)}
                  className="rounded-xl border px-4 py-2 text-sm text-white hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  {modal.cancelText || "Cancel"}
                </button>
              )}
              <button
                onClick={() => resolve(modal.type === "prompt" ? (inputRef.current?.value ?? "") : true)}
                className="rounded-xl border px-4 py-2 text-sm text-white hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                {modal.okText || (modal.type === "alert" ? "OK" : "Confirm")}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </Ctx.Provider>
  );
}
