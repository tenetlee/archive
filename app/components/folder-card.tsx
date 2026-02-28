"use client";

import { useRef, useCallback, useState } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

interface FolderCardProps {
  label: string;
  href: string;
  index: number;
  childCount?: number;
}


const openTransition = {
  type: "spring" as const,
  stiffness: 220,
  damping: 22,
};

const closeTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 34,
};

const folderVariants = {
  rest: {
    rotateY: 0,
    transition: closeTransition,
  },
  hovered: {
    rotateY: 18,
    transition: openTransition,
  },
};

const frontVariants = {
  rest: {
    rotateX: 0,
    transition: closeTransition,
  },
  hovered: {
    rotateX: -26,
    transition: openTransition,
  },
};

const springConfig = { stiffness: 150, damping: 20 };
const TILT_MAX = 6;

function paperCount(childCount: number): number {
  if (childCount <= 0) return 0;
  if (childCount <= 2) return 1;
  if (childCount <= 5) return 2;
  if (childCount <= 10) return 3;
  return 4;
}

export function FolderCard({
  label,
  href,
  index,
  childCount = 0,
}: FolderCardProps) {
  const papers = paperCount(childCount);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const tiltX = useSpring(
    useTransform(mouseY, [-1, 1], [TILT_MAX, -TILT_MAX]),
    springConfig
  );
  const tiltY = useSpring(
    useTransform(mouseX, [-1, 1], [-TILT_MAX, TILT_MAX]),
    springConfig
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const el = cardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      mouseX.set(nx);
      mouseY.set(ny);
    },
    [mouseX, mouseY]
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  }, [mouseX, mouseY]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  return (
    <div>
      <Link href={href} className="group block">
        {/* Flat rectangular hit area */}
        <div
          ref={cardRef}
          className="relative"
          style={{ perspective: "800px" }}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Invisible hit rectangle covering the full card bounds */}
          <div
            className="absolute inset-0 z-30"
            style={{ pointerEvents: "auto" }}
          />

          {/* Ambient tilt layer */}
          <motion.div
            style={{
              rotateX: tiltX,
              rotateY: tiltY,
              willChange: "transform",
              transformStyle: "preserve-3d",
              pointerEvents: "none",
            }}
          >
            {/* Hover open layer */}
            <motion.div
              className="relative w-56 cursor-pointer"
              style={{
                willChange: "transform",
                transformStyle: "preserve-3d",
                pointerEvents: "none",
              }}
              animate={isHovered ? "hovered" : "rest"}
              variants={folderVariants}
            >
              {/* Back panel */}
              <div className="relative">
                <div className="ml-3 h-5 w-20 border border-[var(--folder-border)] bg-foreground" />
                <div className="relative -mt-px h-36 border border-t-0 border-[var(--folder-border)] bg-foreground" />
              </div>

              {/* Paper layers */}
              {papers > 0 &&
                Array.from({ length: papers }).map((_, i) => {
                  const peekUp = 6 + i * 5;
                  const spreadAngle = -26 * ((i + 1) / (papers + 1));
                  return (
                    <motion.div
                      key={i}
                      className="absolute bg-background"
                      style={{
                        left: `${3 + i * 2}px`,
                        right: `${6 + i * 2}px`,
                        bottom: 0,
                        height: `${136 + peekUp}px`,
                        zIndex: 10 + i,
                        border: "1px solid var(--paper-border)",
                        willChange: "transform",
                        transformOrigin: "bottom center",
                        pointerEvents: "none",
                      }}
                      variants={{
                        rest: { rotateX: 0, transition: closeTransition },
                        hovered: {
                          rotateX: spreadAngle,
                          transition: openTransition,
                        },
                      }}
                    />
                  );
                })}

              {/* Front panel */}
              <motion.div
                className="absolute inset-x-0 bottom-0 h-36 border border-[var(--folder-border)] bg-foreground"
                style={{
                  willChange: "transform",
                  transformOrigin: "bottom center",
                  transformStyle: "preserve-3d",
                  zIndex: 10 + papers + 1,
                  pointerEvents: "none",
                }}
                variants={frontVariants}
              >
                <div className="flex h-full items-end p-4">
                  <span className="text-sm font-medium text-background">
                    {label}
                  </span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </Link>
    </div>
  );
}
