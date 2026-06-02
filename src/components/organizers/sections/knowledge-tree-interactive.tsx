"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, GitBranch } from "lucide-react";
import { OrganizerFloatPanel } from "@/components/organizers/sections/organizer-section-shell";
import { STUDY_BRANCHES } from "@/lib/organizers/concept-map-study";

type TreeNode = {
  id: string;
  label: string;
  branchId: number;
  children?: TreeNode[];
};

function buildTree(root: string, branches: string[]): TreeNode {
  return {
    id: "root",
    label: root,
    branchId: -1,
    children: branches.map((branch, index) => ({
      id: `branch-${index}`,
      label: branch,
      branchId: index % STUDY_BRANCHES.length,
    })),
  };
}

function TreeNodeRow({
  node,
  depth,
  selectedId,
  expandedIds,
  onToggle,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  selectedId: string | null;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const branch = node.branchId >= 0 ? STUDY_BRANCHES[node.branchId % STUDY_BRANCHES.length] : null;
  const Icon = branch?.icon;
  const hasChildren = Boolean(node.children?.length);
  const expanded = expandedIds.has(node.id);
  const selected = selectedId === node.id;
  const onPath = selectedId === node.id || node.children?.some((c) => c.id === selectedId);

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          onSelect(node.id);
          if (hasChildren) onToggle(node.id);
        }}
        className={`group flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition ${
          selected
            ? "bg-[rgba(0,255,213,0.14)] ring-1 ring-[rgba(0,255,213,0.35)]"
            : onPath
              ? "bg-[rgba(0,255,213,0.06)]"
              : "hover:bg-[rgba(0,255,213,0.05)]"
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        {hasChildren ? (
          <motion.span animate={{ rotate: expanded ? 90 : 0 }} className="text-[#00FFD5]">
            <ChevronRight size={14} />
          </motion.span>
        ) : (
          <span className="w-3.5" />
        )}
        {Icon ? (
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#07131A]"
            style={{ background: `linear-gradient(135deg, ${branch!.color}, rgba(0,191,255,0.8))` }}
          >
            <Icon size={13} />
          </span>
        ) : (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[rgba(0,255,213,0.15)] text-xs font-bold text-[#00FFD5]">
            ◉
          </span>
        )}
        <span className={`flex-1 text-sm leading-snug ${selected ? "font-semibold text-[#F5F7FA]" : "text-[#F5F7FA]/85"}`}>
          {node.label}
        </span>
      </button>

      {hasChildren && expanded ? (
        <div className="relative ml-4 border-l border-[rgba(0,255,213,0.12)] pl-2">
          {node.children!.map((child) => (
            <TreeNodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function KnowledgeTreeInteractive({ root, branches }: { root: string; branches: string[] }) {
  const tree = useMemo(() => buildTree(root, branches), [root, branches]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(["root"]));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedLabel = useMemo(() => {
    if (selectedId === "root") return root;
    const branch = branches.find((_, i) => `branch-${i}` === selectedId);
    return branch ?? root;
  }, [selectedId, root, branches]);

  function toggle(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <OrganizerFloatPanel title="Knowledge Tree" hint="Navega la jerarquía del tema" icon={<GitBranch size={17} />} span={6}>
      <TreeNodeRow
        node={tree}
        depth={0}
        selectedId={selectedId}
        expandedIds={expandedIds}
        onToggle={toggle}
        onSelect={setSelectedId}
      />

      {selectedId ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl border border-[rgba(0,255,213,0.12)] bg-[rgba(7,19,26,0.45)] p-3"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#00FFD5]">Nodo seleccionado</p>
          <p className="mt-2 text-sm font-semibold text-[#F5F7FA]">{selectedLabel}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {selectedId === "root"
              ? "Tema central del organizador. Expande las ramas para explorar subtemas."
              : "Subtema del documento. Conéctalo con el mapa conceptual para repasar relaciones."}
          </p>
        </motion.div>
      ) : null}
    </OrganizerFloatPanel>
  );
}

/** @deprecated use KnowledgeTreeInteractive */
export const HierarchyTree = KnowledgeTreeInteractive;
