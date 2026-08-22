"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { tagColorSolidClass } from "@/lib/tagColors";

const TAG_COLOR_ORDER = { RED: 0, GREEN: 1, BLUE: 2 } as const;
const MAX_VISIBLE_TAGS = 4;
const COLUMNS = 6;
const GRID_GAP_PX = 20; // gap-5

export interface ModelCardData {
  id: string;
  name: string;
  source: string;
  coverPath: string | null;
  photoCount: number;
  tags: { id: string; name: string; color: keyof typeof TAG_COLOR_ORDER }[];
}

export function ModelGrid({ models }: { models: ModelCardData[] }) {
  const [previewModelId, setPreviewModelId] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rowHeight, setRowHeight] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const firstCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function measure() {
      if (firstCardRef.current) {
        setRowHeight(firstCardRef.current.offsetHeight);
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [previewModelId]);

  useEffect(() => {
    if (previewModelId) {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [previewModelId]);

  async function togglePreview(model: ModelCardData) {
    if (previewModelId === model.id) {
      closePreview();
      return;
    }

    setPreviewModelId(model.id);
    setIndex(0);
    setImages([]);
    setLoading(true);
    try {
      const response = await fetch(`/api/models/${model.id}/renders`);
      const data = await response.json();
      setImages(Array.isArray(data.renders) ? data.renders : []);
    } finally {
      setLoading(false);
    }
  }

  function closePreview() {
    setPreviewModelId(null);
    setImages([]);
  }

  const previewModel = models.find((model) => model.id === previewModelId) ?? null;
  const previewIndex = previewModel ? models.findIndex((model) => model.id === previewModel.id) : -1;
  // On garde la ligne complete intacte (comme CGTrader) : le panneau s'affiche
  // seulement apres le dernier modele de la ligne contenant celui clique.
  const rowEndIndex =
    previewIndex === -1
      ? -1
      : Math.min(Math.floor(previewIndex / COLUMNS) * COLUMNS + COLUMNS - 1, models.length - 1);

  // Hauteur du panneau = exactement 2 lignes de cartes + la marge entre elles.
  const panelHeight = rowHeight ? rowHeight * 2 + GRID_GAP_PX : null;

  return (
    <div className="grid grid-cols-6 gap-5">
      {models.map((model, modelIndex) => {
        const sortedTags = [...model.tags].sort(
          (a, b) => TAG_COLOR_ORDER[a.color] - TAG_COLOR_ORDER[b.color],
        );
        const visibleTags = sortedTags.slice(0, MAX_VISIBLE_TAGS);
        const extraCount = sortedTags.length - visibleTags.length;
        const isPreviewing = previewModelId === model.id;

        return (
          <Fragment key={model.id}>
            <Card
              ref={modelIndex === 0 ? firstCardRef : undefined}
              className="overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="group relative flex aspect-square items-center justify-center bg-muted">
                {model.coverPath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/renders/${model.coverPath}`}
                    alt={model.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">Pas de photo</span>
                )}

                {model.photoCount > 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                    {model.photoCount} photo{model.photoCount > 1 ? "s" : ""}
                  </span>
                )}

                {visibleTags.length > 0 && (
                  <div className="absolute inset-x-1 bottom-1 flex flex-wrap gap-1">
                    {visibleTags.map((tag) => (
                      <span
                        key={tag.id}
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] leading-none",
                          tagColorSolidClass(tag.color),
                        )}
                      >
                        {tag.name}
                      </span>
                    ))}
                    {extraCount > 0 && (
                      <span className="rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] leading-none text-white">
                        +{extraCount}
                      </span>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => togglePreview(model)}
                  className={cn(
                    "absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/40 group-hover:opacity-100",
                    isPreviewing && "bg-black/50 opacity-100",
                  )}
                >
                  <span className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-black">
                    {isPreviewing ? "Previewing" : "Preview"}
                  </span>
                </button>
              </div>
              <CardContent className="p-3">
                <p className="truncate text-sm font-medium">{model.name}</p>
              </CardContent>
            </Card>

            {modelIndex === rowEndIndex && previewModel && (
              <div className="col-span-full" ref={panelRef}>
                <PreviewPanel
                  model={previewModel}
                  images={images}
                  loading={loading}
                  index={index}
                  onIndexChange={setIndex}
                  onClose={closePreview}
                  height={panelHeight}
                />
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

interface PreviewPanelProps {
  model: ModelCardData;
  images: string[];
  loading: boolean;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  height: number | null;
}

function PreviewPanel({ model, images, loading, index, onIndexChange, onClose, height }: PreviewPanelProps) {
  const sortedTags = [...model.tags].sort(
    (a, b) => TAG_COLOR_ORDER[a.color] - TAG_COLOR_ORDER[b.color],
  );

  return (
    <Card className="my-2 overflow-hidden" style={height ? { height } : undefined}>
      <div className="grid h-full grid-cols-12 gap-4 p-4">
        <div className="col-span-12 flex h-full min-h-0 flex-col md:col-span-9">
          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg bg-black">
            {loading || images.length === 0 ? (
              <span className="text-sm text-muted-foreground">
                {loading ? "Chargement..." : "Aucune photo."}
              </span>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/renders/${images[index]}`}
                alt={model.name}
                className="h-full w-full object-contain"
              />
            )}

            {images.length > 0 && (
              <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                {index + 1} / {images.length}
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
            >
              Fermer
            </button>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => onIndexChange((index - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-white hover:bg-black/70"
                >
                  &larr;
                </button>
                <button
                  type="button"
                  onClick={() => onIndexChange((index + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-white hover:bg-black/70"
                >
                  &rarr;
                </button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-2 flex h-14 shrink-0 gap-2 overflow-x-auto pb-1">
              {images.map((imagePath, imageIndex) => (
                <button
                  key={imagePath}
                  type="button"
                  onClick={() => onIndexChange(imageIndex)}
                  className={cn(
                    "h-14 w-14 shrink-0 overflow-hidden rounded-md ring-2 ring-transparent",
                    imageIndex === index && "ring-primary",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/renders/${imagePath}`}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-12 h-full overflow-y-auto md:col-span-3">
          <h3 className="text-lg font-bold">{model.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">Source : {model.source}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {model.photoCount} photo{model.photoCount > 1 ? "s" : ""}
          </p>

          {sortedTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {sortedTags.map((tag) => (
                <span
                  key={tag.id}
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    tagColorSolidClass(tag.color),
                  )}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
