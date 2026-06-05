"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { COVER_GRADIENTS } from "@/lib/cuaderno/preferences";

export function CuadernoSmartCollectionModule({
  href,
  title,
  description,
  count,
  accent,
  cover,
}: {
  href: string;
  title: string;
  description: string;
  count: number;
  accent: string;
  cover: keyof typeof COVER_GRADIENTS;
}) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 340, damping: 28 }}>
      <Link
        href={href}
        className="cn-smart-module"
        style={
          {
            background: COVER_GRADIENTS[cover],
            "--smart-accent": accent,
          } as React.CSSProperties
        }
      >
        <div className="cn-smart-module-glow" aria-hidden />
        <div className="cn-smart-module-body">
          <p className="cn-smart-module-kicker">Colección</p>
          <h3 className="cn-smart-module-title">{title}</h3>
          <p className="cn-smart-module-desc">{description}</p>
        </div>
        <div className="cn-smart-module-foot">
          <span>{count} elementos</span>
          <span className="cn-smart-module-arrow" aria-hidden>
            →
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
