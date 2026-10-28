import { Stroke } from '../types/airdraw';

export interface DrawingLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0.05 to 1.0
  colorTag?: string;
  createdAt: number;
}

export function createDefaultLayers(): { layers: DrawingLayer[]; activeLayerId: string } {
  const layer1: DrawingLayer = {
    id: 'layer-bg-sketch',
    name: 'Draft Sketch',
    visible: true,
    locked: false,
    opacity: 0.6,
    colorTag: '#64748B',
    createdAt: Date.now() - 2000,
  };

  const layer2: DrawingLayer = {
    id: 'layer-line-art',
    name: 'Line Art',
    visible: true,
    locked: false,
    opacity: 1.0,
    colorTag: '#00F0FF',
    createdAt: Date.now() - 1000,
  };

  const layer3: DrawingLayer = {
    id: 'layer-neon-fx',
    name: 'Neon Glow FX',
    visible: true,
    locked: false,
    opacity: 1.0,
    colorTag: '#FF007F',
    createdAt: Date.now(),
  };

  return {
    layers: [layer1, layer2, layer3],
    activeLayerId: layer3.id,
  };
}

export function canDrawOnLayer(layer: DrawingLayer | undefined): boolean {
  if (!layer) return false;
  return layer.visible && !layer.locked;
}

export function getVisibleLayers(layers: DrawingLayer[]): DrawingLayer[] {
  return layers.filter((l) => l.visible);
}

export function getStrokesForLayer(strokes: Stroke[], layerId: string): Stroke[] {
  return strokes.filter((s) => (s.layerId || 'layer-neon-fx') === layerId);
}

export function addLayer(layers: DrawingLayer[], customName?: string): { updatedLayers: DrawingLayer[]; newLayer: DrawingLayer } {
  const newNum = layers.length + 1;
  const newLayer: DrawingLayer = {
    id: `layer-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: customName || `Layer ${newNum}`,
    visible: true,
    locked: false,
    opacity: 1.0,
    colorTag: '#39FF14',
    createdAt: Date.now(),
  };

  return {
    updatedLayers: [...layers, newLayer],
    newLayer,
  };
}

export function removeLayer(
  layers: DrawingLayer[],
  strokes: Stroke[],
  layerIdToRemove: string
): { updatedLayers: DrawingLayer[]; updatedStrokes: Stroke[]; newActiveId?: string } {
  if (layers.length <= 1) {
    // Keep at least one layer
    return { updatedLayers: layers, updatedStrokes: strokes };
  }

  const updatedLayers = layers.filter((l) => l.id !== layerIdToRemove);
  const updatedStrokes = strokes.filter((s) => s.layerId !== layerIdToRemove);
  const newActiveId = updatedLayers[updatedLayers.length - 1]?.id;

  return {
    updatedLayers,
    updatedStrokes,
    newActiveId,
  };
}

export function toggleLayerVisibility(layers: DrawingLayer[], layerId: string): DrawingLayer[] {
  return layers.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l));
}

export function toggleLayerLock(layers: DrawingLayer[], layerId: string): DrawingLayer[] {
  return layers.map((l) => (l.id === layerId ? { ...l, locked: !l.locked } : l));
}

export function setLayerOpacity(layers: DrawingLayer[], layerId: string, opacity: number): DrawingLayer[] {
  const clamped = Math.max(0.05, Math.min(1.0, opacity));
  return layers.map((l) => (l.id === layerId ? { ...l, opacity: clamped } : l));
}

export function renameLayer(layers: DrawingLayer[], layerId: string, newName: string): DrawingLayer[] {
  const trimmed = newName.trim();
  if (!trimmed) return layers;
  return layers.map((l) => (l.id === layerId ? { ...l, name: trimmed } : l));
}

export function moveLayer(layers: DrawingLayer[], index: number, direction: 'up' | 'down'): DrawingLayer[] {
  const targetIndex = direction === 'up' ? index + 1 : index - 1;
  if (targetIndex < 0 || targetIndex >= layers.length) return layers;

  const copy = [...layers];
  const [removed] = copy.splice(index, 1);
  copy.splice(targetIndex, 0, removed);
  return copy;
}

export function duplicateLayer(
  layers: DrawingLayer[],
  strokes: Stroke[],
  layerId: string
): { updatedLayers: DrawingLayer[]; updatedStrokes: Stroke[]; newLayerId: string } {
  const targetLayer = layers.find((l) => l.id === layerId);
  if (!targetLayer) return { updatedLayers: layers, updatedStrokes: strokes, newLayerId: layerId };

  const newId = `layer-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newLayer: DrawingLayer = {
    ...targetLayer,
    id: newId,
    name: `${targetLayer.name} Copy`,
    createdAt: Date.now(),
  };

  const targetIndex = layers.findIndex((l) => l.id === layerId);
  const updatedLayers = [...layers];
  updatedLayers.splice(targetIndex + 1, 0, newLayer);

  // Duplicate strokes for this layer
  const targetStrokes = strokes.filter((s) => (s.layerId || 'layer-neon-fx') === layerId);
  const clonedStrokes: Stroke[] = targetStrokes.map((s) => ({
    ...s,
    id: `stroke-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    layerId: newId,
    points: s.points.map((p) => ({ ...p })),
  }));

  return {
    updatedLayers,
    updatedStrokes: [...strokes, ...clonedStrokes],
    newLayerId: newId,
  };
}

export function mergeLayerDown(
  layers: DrawingLayer[],
  strokes: Stroke[],
  layerId: string
): { updatedLayers: DrawingLayer[]; updatedStrokes: Stroke[]; mergedLayerId: string } | null {
  const index = layers.findIndex((l) => l.id === layerId);
  if (index <= 0) return null; // Cannot merge bottom-most layer down

  const currentLayer = layers[index];
  const lowerLayer = layers[index - 1];

  // Reassign strokes of currentLayer to lowerLayer
  const updatedStrokes = strokes.map((s) => {
    if ((s.layerId || 'layer-neon-fx') === currentLayer.id) {
      return { ...s, layerId: lowerLayer.id };
    }
    return s;
  });

  const updatedLayers = layers.filter((l) => l.id !== currentLayer.id);

  return {
    updatedLayers,
    updatedStrokes,
    mergedLayerId: lowerLayer.id,
  };
}
