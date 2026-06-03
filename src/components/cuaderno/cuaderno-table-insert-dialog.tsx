"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function CuadernoTableInsertDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (rows: number, cols: number) => void;
}) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  const submit = () => {
    const r = Math.min(20, Math.max(1, rows));
    const c = Math.min(12, Math.max(1, cols));
    onConfirm(r, c);
    onClose();
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="cn-table-dialog-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="cn-table-dialog"
            role="dialog"
            aria-labelledby="cn-table-dialog-title"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
          >
            <h2 id="cn-table-dialog-title">Insertar tabla</h2>
            <p>Define el tamaño antes de crearla.</p>
            <div className="cn-table-dialog-fields">
              <label>
                Filas
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={rows}
                  onChange={(e) => setRows(Number(e.target.value) || 1)}
                />
              </label>
              <label>
                Columnas
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={cols}
                  onChange={(e) => setCols(Number(e.target.value) || 1)}
                />
              </label>
            </div>
            <div className="cn-table-dialog-actions">
              <button type="button" onClick={onClose}>
                Cancelar
              </button>
              <button type="button" className="cn-table-dialog-primary" onClick={submit}>
                Crear tabla
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
