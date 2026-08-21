"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { tagColorSolidClass } from "@/lib/tagColors";

const TAG_COLOR_ORDER = { RED: 0, GREEN: 1, BLUE: 2 } as const;
const MAX_VISIBLE_TAGS = 4;

export interface ModelCardData {
  id: string;
  name: string;
  coverPath: string | null;
  photoCount: number;
  tags: { id: string; name: string; color: keyof typeof TAG_COLOR_ORDER }[];
}

export function ModelGrid({ models }: { models: ModelCardData[] }) {
  const [previewModelId, setPreviewModelId] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const previewModel = models.find((model) => model.id === previewModelId) ?? null;

  async function openPreview(model: ModelCardData) {
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

  return (
    <>
      <div className="grid grid-cols-6 gap-5">
        {models.map((model) => {
          const sortedTags = [...model.tags].sort(
            (a, b) => TAG_COLOR_ORDER[a.color] - TAG_COLOR_ORDER[b.color],
          );
          const visibleTags = sortedTags.slice(0, MAX_VISIBLE_TAGS);
          const extraCount = sortedTags.length - visibleTags.length;

          return (
            <Card
              key={model.id}
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
                  onClick={() => openPreview(model)}
                  className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/40 group-hover:opacity-100"
                >
                  <span className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-black">
                    Preview
                  </span>
                </button>
              </div>
              <CardContent className="p-3">
                <p className="truncate text-sm font-medium">{model.name}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {previewModel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={closePreview}
        >
          <div
            className="relative flex w-full max-w-2xl flex-col items-center"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closePreview}
              className="absolute -top-10 right-0 text-sm text-white hover:underline"
            >
              Fermer
            </button>

            <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-muted">
              {loading || images.length === 0 ? (
                <span className="text-sm text-muted-foreground">
                  {loading ? "Chargement..." : "Aucune photo."}
                </span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/renders/${images[index]}`}
                  alt={previewModel.name}
                  className="h-full w-full object-contain"
                />
              )}

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setIndex((current) => (current - 1 + images.length) % images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-white"
                  >
                    &larr;
                  </button>
                  <button
                    type="button"
                    onClick={() => setIndex((current) => (current + 1) % images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-white"
                  >
                    &rarr;
                  </button>
                </>
              )}
            </div>

            <p className="mt-3 text-sm text-white">
              {previewModel.name}
              {images.length > 0 ? ` - ${index + 1}/${images.length}` : ""}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
