import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import {
  Brush,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Contrast,
  Check,
  Square,
  Circle,
  Triangle,
  Star,
  Heart,
  Minus,
  MoveRight,
  Diamond,
  Plus,
  Maximize2,
  Move,
  PaintBucket,
  RotateCw,
} from 'lucide-react';
import {
  DrawingBatchPayload,
  DrawingStroke,
  PointNormalized,
  ShapeGeometry,
  ShapeType,
  StrokePhase,
} from '../shared/types';
import { BRUSH_WIDTHS, DRAWING_PALETTE } from '../shared/catalog';

export interface DrawingCanvasHandle {
  applyBatch: (batch: DrawingBatchPayload) => void;
  replaceStrokes: (newStrokes: DrawingStroke[]) => void;
  clearCanvas: () => void;
  getStrokesCount: () => number;
  getStrokes: () => DrawingStroke[];
  isActivelyDrawing: () => boolean;
}

interface DrawingCanvasProps {
  initialStrokes: DrawingStroke[];
  roundId: string | null;
  isDrawer: boolean;
  isDrawingPhase: boolean;
  onEmitBatch: (payload: DrawingBatchPayload) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  compactMode?: boolean;
  batchIntervalMs?: number;
}

const LOGICAL_WIDTH = 960;
const LOGICAL_HEIGHT = 560;
const DEFAULT_BATCH_INTERVAL_MS = 40; // 25 updates per second smooth real-time streaming
const MAX_POINTS_PER_BATCH = 64; // Compact batch limit

const SHAPE_OPTIONS: Array<{ id: ShapeType; label: string; icon: React.ReactNode }> = [
  { id: 'rect', label: 'Retângulo', icon: <Square className="w-3.5 h-3.5" /> },
  { id: 'circle', label: 'Círculo', icon: <Circle className="w-3.5 h-3.5" /> },
  { id: 'triangle', label: 'Triângulo', icon: <Triangle className="w-3.5 h-3.5" /> },
  { id: 'star', label: 'Estrela', icon: <Star className="w-3.5 h-3.5" /> },
  { id: 'heart', label: 'Coração', icon: <Heart className="w-3.5 h-3.5" /> },
  { id: 'diamond', label: 'Losango', icon: <Diamond className="w-3.5 h-3.5" /> },
  { id: 'line', label: 'Linha', icon: <Minus className="w-3.5 h-3.5" /> },
  { id: 'arrow', label: 'Seta', icon: <MoveRight className="w-3.5 h-3.5" /> },
];

type DragHandleType =
  | 'move'
  | 'rotate'
  | 'nw'
  | 'ne'
  | 'sw'
  | 'se'
  | 'n'
  | 's'
  | 'e'
  | 'w'
  | 'create_shape';

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  (
    {
      initialStrokes,
      roundId,
      isDrawer,
      isDrawingPhase,
      onEmitBatch,
      onUndo,
      onRedo,
      onClear,
      compactMode = false,
      batchIntervalMs = DEFAULT_BATCH_INTERVAL_MS,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Authoritative canvas stroke memory kept in a ref so pointermove and incoming batches
    // NEVER trigger React re-renders (Section 4 Rules 1, 2, 9).
    const strokesRef = useRef<DrawingStroke[]>([]);
    const lastRoundIdRef = useRef<string | null>(null);

    const [hasStrokes, setHasStrokes] = useState<boolean>(false);
    const hasStrokesRef = useRef<boolean>(false);
    const [tool, setTool] = useState<'brush' | 'eraser' | 'shape'>('brush');
    const [selectedShapeType, setSelectedShapeType] = useState<ShapeType>('rect');
    const [shapeFilled, setShapeFilled] = useState<boolean>(false);
    const [color, setColor] = useState<string>(DRAWING_PALETTE[0].hex);
    const [brushWidth, setBrushWidth] = useState<number>(BRUSH_WIDTHS[1].size);
    const [highContrast, setHighContrast] = useState<boolean>(false);
    const [confirmClear, setConfirmClear] = useState<boolean>(false);

    const [activeShapeId, setActiveShapeId] = useState<string | null>(null);
    const activeShapeIdRef = useRef<string | null>(null);
    const [, setShapeRevision] = useState<number>(0);

    // Refs to prevent stale closures inside setInterval / pointer handlers
    const toolRef = useRef<'brush' | 'eraser' | 'shape'>(tool);
    toolRef.current = tool;
    const colorRef = useRef<string>(color);
    colorRef.current = color;
    const brushWidthRef = useRef<number>(brushWidth);
    brushWidthRef.current = brushWidth;
    const onEmitBatchRef = useRef(onEmitBatch);
    onEmitBatchRef.current = onEmitBatch;
    const roundIdRef = useRef<string | null>(roundId);
    roundIdRef.current = roundId;
    const isDrawerRef = useRef<boolean>(isDrawer);
    isDrawerRef.current = isDrawer;
    activeShapeIdRef.current = activeShapeId;

    const updateHasStrokes = useCallback((val: boolean) => {
      if (hasStrokesRef.current !== val) {
        hasStrokesRef.current = val;
        if (isDrawerRef.current) {
          setHasStrokes(val);
        }
      }
    }, []);

    const isPointerDownRef = useRef<boolean>(false);
    const activeStrokeIdRef = useRef<string | null>(null);
    const activePointsRef = useRef<PointNormalized[]>([]);
    const pendingEmitPointsRef = useRef<PointNormalized[]>([]);
    const pendingPhaseRef = useRef<StrokePhase>('start');
    const sequenceRef = useRef<number>(0);
    const emitIntervalRef = useRef<number | null>(null);
    const lastShapeEmitAtRef = useRef<number>(0);

    const shapeDragStateRef = useRef<{
      strokeId: string;
      handle: DragHandleType;
      startPt: PointNormalized;
      initialShape: ShapeGeometry;
    } | null>(null);

    const canInteract = isDrawer && isDrawingPhase;

    const activeShapeStroke = activeShapeId
      ? strokesRef.current.find((s) => s.id === activeShapeId && s.tool === 'shape' && s.shape)
      : undefined;

    const renderShapeOnCtx = useCallback(
      (
        ctx: CanvasRenderingContext2D,
        shape: ShapeGeometry,
        strokeColor: string,
        strokeWidth: number
      ) => {
        const cx = shape.x * LOGICAL_WIDTH;
        const cy = shape.y * LOGICAL_HEIGHT;
        const w = shape.w * LOGICAL_WIDTH;
        const h = shape.h * LOGICAL_HEIGHT;
        const rotRad = ((shape.rotation ?? 0) * Math.PI) / 180;
        const left = cx - w / 2;
        const top = cy - h / 2;
        const right = cx + w / 2;
        const bottom = cy + h / 2;

        ctx.save();
        if (rotRad !== 0) {
          ctx.translate(cx, cy);
          ctx.rotate(rotRad);
          ctx.translate(-cx, -cy);
        }
        ctx.strokeStyle = strokeColor;
        ctx.fillStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();

        switch (shape.shapeType) {
          case 'rect': {
            ctx.rect(left, top, w, h);
            break;
          }
          case 'circle': {
            ctx.ellipse(cx, cy, Math.max(2, w / 2), Math.max(2, h / 2), 0, 0, Math.PI * 2);
            break;
          }
          case 'triangle': {
            ctx.moveTo(cx, top);
            ctx.lineTo(right, bottom);
            ctx.lineTo(left, bottom);
            ctx.closePath();
            break;
          }
          case 'diamond': {
            ctx.moveTo(cx, top);
            ctx.lineTo(right, cy);
            ctx.lineTo(cx, bottom);
            ctx.lineTo(left, cy);
            ctx.closePath();
            break;
          }
          case 'star': {
            const spikes = 5;
            const outerRadiusX = w / 2;
            const outerRadiusY = h / 2;
            const innerRadiusX = outerRadiusX * 0.42;
            const innerRadiusY = outerRadiusY * 0.42;
            for (let i = 0; i < spikes * 2; i++) {
              const rx = i % 2 === 0 ? outerRadiusX : innerRadiusX;
              const ry = i % 2 === 0 ? outerRadiusY : innerRadiusY;
              const angle = (i * Math.PI) / spikes - Math.PI / 2;
              const px = cx + Math.cos(angle) * rx;
              const py = cy + Math.sin(angle) * ry;
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            break;
          }
          case 'heart': {
            const topCurveHeight = h * 0.3;
            ctx.moveTo(cx, top + topCurveHeight);
            ctx.bezierCurveTo(cx, top, left, top, left, top + topCurveHeight);
            ctx.bezierCurveTo(
              left,
              top + (h + topCurveHeight) / 2,
              cx,
              top + (h + topCurveHeight) / 1.45,
              cx,
              bottom
            );
            ctx.bezierCurveTo(
              cx,
              top + (h + topCurveHeight) / 1.45,
              right,
              top + (h + topCurveHeight) / 2,
              right,
              top + topCurveHeight
            );
            ctx.bezierCurveTo(right, top, cx, top, cx, top + topCurveHeight);
            ctx.closePath();
            break;
          }
          case 'line': {
            ctx.moveTo(left, bottom);
            ctx.lineTo(right, top);
            break;
          }
          case 'arrow': {
            const headW = Math.min(w * 0.35, 45);
            const shaftH = Math.max(8, h * 0.36);
            ctx.moveTo(left, cy - shaftH / 2);
            ctx.lineTo(right - headW, cy - shaftH / 2);
            ctx.lineTo(right - headW, top);
            ctx.lineTo(right, cy);
            ctx.lineTo(right - headW, bottom);
            ctx.lineTo(right - headW, cy + shaftH / 2);
            ctx.lineTo(left, cy + shaftH / 2);
            ctx.closePath();
            break;
          }
        }

        if (shape.filled && shape.shapeType !== 'line') {
          ctx.fill();
        }
        ctx.stroke();
        ctx.restore();
      },
      []
    );

    const renderStrokeOnCtx = useCallback(
      (
        ctx: CanvasRenderingContext2D,
        strokeTool: 'brush' | 'eraser' | 'shape',
        strokeColor: string,
        strokeWidth: number,
        points: PointNormalized[],
        shape?: ShapeGeometry
      ) => {
        if (strokeTool === 'shape' && shape) {
          renderShapeOnCtx(ctx, shape, strokeColor, strokeWidth);
          return;
        }

        if (points.length === 0) return;

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = strokeWidth;

        const actualColor = strokeTool === 'eraser' ? '#FFFFFF' : strokeColor;
        ctx.strokeStyle = actualColor;
        ctx.fillStyle = actualColor;

        if (points.length === 1) {
          const x = points[0].x * LOGICAL_WIDTH;
          const y = points[0].y * LOGICAL_HEIGHT;
          ctx.beginPath();
          ctx.arc(x, y, strokeWidth / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          return;
        }

        ctx.beginPath();
        ctx.moveTo(points[0].x * LOGICAL_WIDTH, points[0].y * LOGICAL_HEIGHT);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x * LOGICAL_WIDTH, points[i].y * LOGICAL_HEIGHT);
        }
        ctx.stroke();
        ctx.restore();
      },
      [renderShapeOnCtx]
    );

    /**
     * Rule 9: Incremental drawing directly onto HTML Canvas 2D without clearing or rebuilding the whole canvas.
     */
    const drawIncrementalSegmentOnCtx = useCallback(
      (
        strokeTool: 'brush' | 'eraser',
        strokeColor: string,
        strokeWidth: number,
        prevPoint: PointNormalized | null,
        newPoints: PointNormalized[]
      ) => {
        if (newPoints.length === 0) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = strokeWidth;
        const actualColor = strokeTool === 'eraser' ? '#FFFFFF' : strokeColor;
        ctx.strokeStyle = actualColor;
        ctx.fillStyle = actualColor;

        if (!prevPoint && newPoints.length === 1) {
          const x = newPoints[0].x * LOGICAL_WIDTH;
          const y = newPoints[0].y * LOGICAL_HEIGHT;
          ctx.beginPath();
          ctx.arc(x, y, strokeWidth / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          return;
        }

        ctx.beginPath();
        const startPt = prevPoint ?? newPoints[0];
        ctx.moveTo(startPt.x * LOGICAL_WIDTH, startPt.y * LOGICAL_HEIGHT);
        const startIdx = prevPoint ? 0 : 1;
        for (let i = startIdx; i < newPoints.length; i++) {
          ctx.lineTo(newPoints[i].x * LOGICAL_WIDTH, newPoints[i].y * LOGICAL_HEIGHT);
        }
        ctx.stroke();
        ctx.restore();
      },
      []
    );

    const redrawAllFromRef = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

      for (const s of strokesRef.current) {
        renderStrokeOnCtx(ctx, s.tool, s.color, s.width, s.points, s.shape);
      }

      const currentActiveShape = activeShapeId
        ? strokesRef.current.find((s) => s.id === activeShapeId && s.tool === 'shape' && s.shape)
        : undefined;

      if (canInteract && currentActiveShape && currentActiveShape.shape) {
        const sh = currentActiveShape.shape;
        const cx = sh.x * LOGICAL_WIDTH;
        const cy = sh.y * LOGICAL_HEIGHT;
        const w = sh.w * LOGICAL_WIDTH;
        const h = sh.h * LOGICAL_HEIGHT;
        const rotRad = ((sh.rotation ?? 0) * Math.PI) / 180;
        const left = cx - w / 2;
        const top = cy - h / 2;

        ctx.save();
        if (rotRad !== 0) {
          ctx.translate(cx, cy);
          ctx.rotate(rotRad);
          ctx.translate(-cx, -cy);
        }

        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(left - 6, top - 6, w + 12, h + 12);
        ctx.setLineDash([]);

        // Rotation handle stem + knob above top center
        const rotKnobY = top - 34;
        ctx.beginPath();
        ctx.moveTo(cx, top - 6);
        ctx.lineTo(cx, rotKnobY);
        ctx.strokeStyle = '#4F46E5';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, rotKnobY, 9, 0, Math.PI * 2);
        ctx.fillStyle = '#4F46E5';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();

        const handles = [
          { x: left - 6, y: top - 6 },
          { x: cx, y: top - 6 },
          { x: left + w + 6, y: top - 6 },
          { x: left + w + 6, y: cy },
          { x: left + w + 6, y: top + h + 6 },
          { x: cx, y: top + h + 6 },
          { x: left - 6, y: top + h + 6 },
          { x: left - 6, y: cy },
        ];

        for (const hPt of handles) {
          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = '#D97706';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.rect(hPt.x - 6, hPt.y - 6, 12, 12);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }
    }, [activeShapeId, canInteract, renderStrokeOnCtx]);

    // Imperative handle for direct WebSocket -> Canvas updates without React state re-renders
    useImperativeHandle(
      ref,
      () => ({
        applyBatch: (batch: DrawingBatchPayload) => {
          const list = strokesRef.current;
          const existingIdx = list.findIndex((s) => s.id === batch.strokeId);

          if (batch.tool === 'shape' && batch.shape) {
            if (existingIdx === -1) {
              list.push({
                id: batch.strokeId,
                roundId: batch.roundId || roundIdRef.current || '',
                playerId: batch.playerId || '',
                tool: 'shape',
                color: batch.color,
                width: batch.width,
                points: [],
                shape: batch.shape,
                sequence: batch.sequence,
                createdAt: Date.now(),
              });
            } else {
              list[existingIdx] = {
                ...list[existingIdx],
                color: batch.color,
                width: batch.width,
                shape: batch.shape,
                sequence: Math.max(list[existingIdx].sequence, batch.sequence),
              };
            }
            updateHasStrokes(true);
            redrawAllFromRef();
            return;
          }

          const incomingPoints = Array.isArray(batch.points) ? batch.points : [];
          if (incomingPoints.length === 0) return;

          const strokeTool = batch.tool === 'eraser' ? 'eraser' : 'brush';
          if (existingIdx === -1) {
            list.push({
              id: batch.strokeId,
              roundId: batch.roundId || roundIdRef.current || '',
              playerId: batch.playerId || '',
              tool: strokeTool,
              color: batch.color,
              width: batch.width,
              points: [...incomingPoints],
              sequence: batch.sequence,
              createdAt: Date.now(),
            });
            updateHasStrokes(true);
            drawIncrementalSegmentOnCtx(
              strokeTool,
              batch.color,
              batch.width,
              null,
              incomingPoints
            );
          } else {
            const existing = list[existingIdx];
            if (batch.sequence > 0 && batch.sequence <= existing.sequence && existing.points.length > 0) {
              return; // Duplicate packet guard
            }
            const prevPt =
              existing.points.length > 0
                ? existing.points[existing.points.length - 1]
                : null;
            existing.points.push(...incomingPoints);
            existing.sequence = Math.max(existing.sequence, batch.sequence);
            drawIncrementalSegmentOnCtx(
              strokeTool,
              existing.color,
              existing.width,
              prevPt,
              incomingPoints
            );
          }
        },
        replaceStrokes: (newStrokes: DrawingStroke[]) => {
          strokesRef.current = newStrokes.map((s) => ({
            ...s,
            points: Array.isArray(s.points) ? [...s.points] : [],
            shape: s.shape ? { ...s.shape } : undefined,
          }));
          updateHasStrokes(strokesRef.current.length > 0);
          if (
            activeShapeIdRef.current &&
            !strokesRef.current.some((s) => s.id === activeShapeIdRef.current)
          ) {
            setActiveShapeId(null);
          }
          redrawAllFromRef();
        },
        clearCanvas: () => {
          strokesRef.current = [];
          updateHasStrokes(false);
          setActiveShapeId(null);
          redrawAllFromRef();
        },
        getStrokesCount: () => strokesRef.current.length,
        getStrokes: () => strokesRef.current,
        isActivelyDrawing: () => isPointerDownRef.current,
      }),
      [drawIncrementalSegmentOnCtx, redrawAllFromRef, updateHasStrokes]
    );

    // Sync initial snapshot when roundId changes or when initialStrokes snapshot is provided
    useEffect(() => {
      if (lastRoundIdRef.current !== roundId) {
        lastRoundIdRef.current = roundId;
        strokesRef.current = (initialStrokes || []).map((s) => ({
          ...s,
          points: Array.isArray(s.points) ? [...s.points] : [],
          shape: s.shape ? { ...s.shape } : undefined,
        }));
        updateHasStrokes(strokesRef.current.length > 0);
        setActiveShapeId(null);
        redrawAllFromRef();
      } else if (
        initialStrokes &&
        initialStrokes.length > 0 &&
        strokesRef.current.length === 0
      ) {
        strokesRef.current = initialStrokes.map((s) => ({
          ...s,
          points: Array.isArray(s.points) ? [...s.points] : [],
          shape: s.shape ? { ...s.shape } : undefined,
        }));
        updateHasStrokes(true);
        redrawAllFromRef();
      }
    }, [roundId, initialStrokes, redrawAllFromRef, updateHasStrokes]);

    useEffect(() => {
      redrawAllFromRef();
    }, [activeShapeId, redrawAllFromRef]);

    useEffect(() => {
      if (!canInteract) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
          e.preventDefault();
          if (e.shiftKey) onRedo();
          else onUndo();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
          e.preventDefault();
          onRedo();
        } else if (e.key === 'Escape') {
          setActiveShapeId(null);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canInteract, onUndo, onRedo]);

    const getNormalizedPoint = (e: React.PointerEvent<HTMLCanvasElement>): PointNormalized => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, Number(((e.clientX - rect.left) / Math.max(1, rect.width)).toFixed(4))));
      const y = Math.max(0, Math.min(1, Number(((e.clientY - rect.top) / Math.max(1, rect.height)).toFixed(4))));
      return { x, y };
    };

    const upsertShapeGeometry = useCallback(
      (
        strokeId: string,
        newGeom: ShapeGeometry,
        overrideColor?: string,
        overrideWidth?: number,
        forceEmit = false
      ) => {
        const list = strokesRef.current;
        const idx = list.findIndex((s) => s.id === strokeId);
        const strokeColor = overrideColor ?? (idx !== -1 ? list[idx].color : color);
        const strokeWidth = overrideWidth ?? (idx !== -1 ? list[idx].width : brushWidth);

        sequenceRef.current += 1;
        if (idx === -1) {
          list.push({
            id: strokeId,
            roundId: roundId || '',
            playerId: '',
            tool: 'shape',
            color: strokeColor,
            width: strokeWidth,
            points: [],
            shape: newGeom,
            sequence: sequenceRef.current,
            createdAt: Date.now(),
          });
          if (!hasStrokes) setHasStrokes(true);
        } else {
          list[idx] = {
            ...list[idx],
            color: strokeColor,
            width: strokeWidth,
            shape: newGeom,
            sequence: sequenceRef.current,
          };
        }

        redrawAllFromRef();
        setShapeRevision((r) => r + 1);

        const now = Date.now();
        if (forceEmit || now - lastShapeEmitAtRef.current >= batchIntervalMs) {
          lastShapeEmitAtRef.current = now;
          onEmitBatch({
            strokeId,
            phase: 'shape',
            tool: 'shape',
            color: strokeColor,
            width: strokeWidth,
            points: [],
            shape: newGeom,
            sequence: sequenceRef.current,
          });
        }
      },
      [color, brushWidth, roundId, hasStrokes, batchIntervalMs, onEmitBatch, redrawAllFromRef]
    );

    const handleInsertShapeCenter = (shapeTypeOverride?: ShapeType) => {
      if (!canInteract) return;
      const sType = shapeTypeOverride ?? selectedShapeType;
      setSelectedShapeType(sType);
      setTool('shape');

      const newId = `shp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
      const geom: ShapeGeometry = {
        shapeType: sType,
        x: 0.5,
        y: 0.5,
        w: 0.24,
        h: 0.34,
        rotation: 0,
        filled: shapeFilled,
      };

      setActiveShapeId(newId);
      upsertShapeGeometry(newId, geom, color, brushWidth, true);
    };

    // Transform a normalized pointer coordinate into the shape's unrotated local space
    const toShapeLocalPoint = (pt: PointNormalized, sh: ShapeGeometry): PointNormalized => {
      const rotDeg = sh.rotation ?? 0;
      if (!rotDeg) return pt;
      const rad = (-rotDeg * Math.PI) / 180;
      const dxPx = (pt.x - sh.x) * LOGICAL_WIDTH;
      const dyPx = (pt.y - sh.y) * LOGICAL_HEIGHT;
      const localDxPx = dxPx * Math.cos(rad) - dyPx * Math.sin(rad);
      const localDyPx = dxPx * Math.sin(rad) + dyPx * Math.cos(rad);
      return {
        x: sh.x + localDxPx / LOGICAL_WIDTH,
        y: sh.y + localDyPx / LOGICAL_HEIGHT,
      };
    };

    const detectHandleHit = (pt: PointNormalized, sh: ShapeGeometry): DragHandleType | null => {
      const localPt = toShapeLocalPoint(pt, sh);
      const halfW = sh.w / 2 + 6 / LOGICAL_WIDTH;
      const halfH = sh.h / 2 + 6 / LOGICAL_HEIGHT;
      const left = sh.x - halfW;
      const right = sh.x + halfW;
      const top = sh.y - halfH;
      const bottom = sh.y + halfH;

      // Check rotation knob above top-center (34px above top edge)
      const rotKnobY = sh.y - sh.h / 2 - 34 / LOGICAL_HEIGHT;
      const rotDistPx = Math.hypot(
        (localPt.x - sh.x) * LOGICAL_WIDTH,
        (localPt.y - rotKnobY) * LOGICAL_HEIGHT
      );
      if (rotDistPx <= 20) return 'rotate';

      const hitDistPx = (hx: number, hy: number) =>
        Math.hypot((localPt.x - hx) * LOGICAL_WIDTH, (localPt.y - hy) * LOGICAL_HEIGHT);

      const handleTolPx = 18;
      if (hitDistPx(left, top) <= handleTolPx) return 'nw';
      if (hitDistPx(right, top) <= handleTolPx) return 'ne';
      if (hitDistPx(left, bottom) <= handleTolPx) return 'sw';
      if (hitDistPx(right, bottom) <= handleTolPx) return 'se';
      if (hitDistPx(sh.x, top) <= handleTolPx) return 'n';
      if (hitDistPx(sh.x, bottom) <= handleTolPx) return 's';
      if (hitDistPx(right, sh.y) <= handleTolPx) return 'e';
      if (hitDistPx(left, sh.y) <= handleTolPx) return 'w';

      if (localPt.x >= left && localPt.x <= right && localPt.y >= top && localPt.y <= bottom) {
        return 'move';
      }
      return null;
    };

    /**
     * Flushes buffered points using stable refs so closures never go stale mid-stroke.
     */
    const flushPendingPoints = useCallback(
      (explicitPhase?: StrokePhase) => {
        if (!activeStrokeIdRef.current || pendingEmitPointsRef.current.length === 0) return;

        const batch = pendingEmitPointsRef.current.splice(0, MAX_POINTS_PER_BATCH);
        if (batch.length === 0) return;

        sequenceRef.current += 1;
        const phaseToUse: StrokePhase = explicitPhase ?? pendingPhaseRef.current;
        pendingPhaseRef.current = 'move';

        onEmitBatchRef.current({
          strokeId: activeStrokeIdRef.current,
          phase: phaseToUse,
          tool: toolRef.current === 'eraser' ? 'eraser' : 'brush',
          color: colorRef.current,
          width: brushWidthRef.current,
          points: batch,
          sequence: sequenceRef.current,
        });
      },
      []
    );

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!canInteract) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);

      const pt = getNormalizedPoint(e);

      const currentActiveShape = activeShapeId
        ? strokesRef.current.find((s) => s.id === activeShapeId && s.tool === 'shape' && s.shape)
        : undefined;

      if (currentActiveShape && currentActiveShape.shape) {
        const hit = detectHandleHit(pt, currentActiveShape.shape);
        if (hit) {
          isPointerDownRef.current = true;
          shapeDragStateRef.current = {
            strokeId: currentActiveShape.id,
            handle: hit,
            startPt: pt,
            initialShape: { ...currentActiveShape.shape },
          };
          return;
        } else {
          // Clicking outside the active shape automatically fixes/stamps it in place!
          upsertShapeGeometry(
            currentActiveShape.id,
            currentActiveShape.shape,
            currentActiveShape.color,
            currentActiveShape.width,
            true
          );
          setActiveShapeId(null);
          if (tool === 'shape') {
            return;
          }
        }
      }

      if (tool === 'shape') {
        const newId = `shp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
        const initialGeom: ShapeGeometry = {
          shapeType: selectedShapeType,
          x: pt.x,
          y: pt.y,
          w: 0.14,
          h: 0.2,
          rotation: 0,
          filled: shapeFilled,
        };
        setActiveShapeId(newId);
        isPointerDownRef.current = true;
        shapeDragStateRef.current = {
          strokeId: newId,
          handle: 'create_shape',
          startPt: pt,
          initialShape: initialGeom,
        };
        upsertShapeGeometry(newId, initialGeom, color, brushWidth, true);
        return;
      }

      if (activeShapeId) {
        setActiveShapeId(null);
      }

      const strokeId = `stk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
      const strokeTool = tool === 'eraser' ? 'eraser' : 'brush';

      isPointerDownRef.current = true;
      activeStrokeIdRef.current = strokeId;
      activePointsRef.current = [pt];
      pendingEmitPointsRef.current = [pt];
      pendingPhaseRef.current = 'start';
      sequenceRef.current = 0;

      strokesRef.current.push({
        id: strokeId,
        roundId: roundId || '',
        playerId: '',
        tool: strokeTool,
        color,
        width: brushWidth,
        points: [pt],
        sequence: 1,
        createdAt: Date.now(),
      });
      updateHasStrokes(true);

      // Draw initial point directly on Canvas 2D without full redraw
      drawIncrementalSegmentOnCtx(strokeTool, color, brushWidth, null, [pt]);
      flushPendingPoints('start');

      if (emitIntervalRef.current) clearInterval(emitIntervalRef.current);
      emitIntervalRef.current = window.setInterval(() => {
        flushPendingPoints('move');
      }, batchIntervalMs);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!canInteract || !isPointerDownRef.current) return;
      e.preventDefault();
      const pt = getNormalizedPoint(e);

      if (shapeDragStateRef.current) {
        const { strokeId, handle, startPt, initialShape } = shapeDragStateRef.current;
        const dx = pt.x - startPt.x;
        const dy = pt.y - startPt.y;
        const next: ShapeGeometry = { ...initialShape };

        if (handle === 'move') {
          next.x = Math.max(0.02, Math.min(0.98, Number((initialShape.x + dx).toFixed(4))));
          next.y = Math.max(0.02, Math.min(0.98, Number((initialShape.y + dy).toFixed(4))));
        } else if (handle === 'rotate') {
          const cxPx = initialShape.x * LOGICAL_WIDTH;
          const cyPx = initialShape.y * LOGICAL_HEIGHT;
          const px = pt.x * LOGICAL_WIDTH;
          const py = pt.y * LOGICAL_HEIGHT;
          const rawDeg = (Math.atan2(py - cyPx, px - cxPx) * 180) / Math.PI + 90;
          next.rotation = Math.round(((rawDeg % 360) + 360) % 360);
        } else if (handle === 'create_shape') {
          const dist = Math.hypot(dx, dy);
          if (dist < 0.015) {
            // Small click without dragging: keep default comfortable size centered at click
            next.x = startPt.x;
            next.y = startPt.y;
          } else {
            const minX = Math.min(startPt.x, pt.x);
            const maxX = Math.max(startPt.x, pt.x);
            const minY = Math.min(startPt.y, pt.y);
            const maxY = Math.max(startPt.y, pt.y);
            next.w = Number(Math.max(0.05, maxX - minX).toFixed(4));
            next.h = Number(Math.max(0.07, maxY - minY).toFixed(4));
            next.x = Number((minX + next.w / 2).toFixed(4));
            next.y = Number((minY + next.h / 2).toFixed(4));
          }
        } else {
          // Project drag delta onto the shape's local axes so resizing works smoothly even when rotated
          const localPt = toShapeLocalPoint(pt, initialShape);
          const localStart = toShapeLocalPoint(startPt, initialShape);
          const ldx = localPt.x - localStart.x;
          const ldy = localPt.y - localStart.y;

          let left = initialShape.x - initialShape.w / 2;
          let right = initialShape.x + initialShape.w / 2;
          let top = initialShape.y - initialShape.h / 2;
          let bottom = initialShape.y + initialShape.h / 2;

          if (handle.includes('w')) left = Math.min(right - 0.03, left + ldx);
          if (handle.includes('e')) right = Math.max(left + 0.03, right + ldx);
          if (handle.includes('n')) top = Math.min(bottom - 0.04, top + ldy);
          if (handle.includes('s')) bottom = Math.max(top + 0.04, bottom + ldy);

          next.w = Number(Math.max(0.03, Math.min(0.98, right - left)).toFixed(4));
          next.h = Number(Math.max(0.04, Math.min(0.98, bottom - top)).toFixed(4));
          if (!(initialShape.rotation ?? 0)) {
            next.x = Number(Math.max(0.02, Math.min(0.98, left + next.w / 2)).toFixed(4));
            next.y = Number(Math.max(0.02, Math.min(0.98, top + next.h / 2)).toFixed(4));
          }
        }

        upsertShapeGeometry(strokeId, next, undefined, undefined, false);
        return;
      }

      const last = activePointsRef.current[activePointsRef.current.length - 1];
      if (last) {
        const dist = Math.hypot(pt.x - last.x, pt.y - last.y);
        if (dist < 0.0025) return;
      }

      activePointsRef.current.push(pt);
      pendingEmitPointsRef.current.push(pt);

      const currentStroke = strokesRef.current[strokesRef.current.length - 1];
      if (currentStroke && currentStroke.id === activeStrokeIdRef.current) {
        currentStroke.points.push(pt);
      }

      // Draw ONLY the new line segment onto Canvas 2D — zero React state updates!
      drawIncrementalSegmentOnCtx(
        tool === 'eraser' ? 'eraser' : 'brush',
        color,
        brushWidth,
        last ?? null,
        [pt]
      );
    };

    const endCurrentStroke = useCallback(() => {
      if (!isPointerDownRef.current) return;
      if (shapeDragStateRef.current) {
        const { strokeId } = shapeDragStateRef.current;
        const shapeStroke = strokesRef.current.find((s) => s.id === strokeId);
        if (shapeStroke && shapeStroke.shape) {
          upsertShapeGeometry(strokeId, shapeStroke.shape, shapeStroke.color, shapeStroke.width, true);
        }
        shapeDragStateRef.current = null;
        isPointerDownRef.current = false;
        return;
      }

      if (emitIntervalRef.current) {
        clearInterval(emitIntervalRef.current);
        emitIntervalRef.current = null;
      }
      while (pendingEmitPointsRef.current.length > 0) {
        const isLast = pendingEmitPointsRef.current.length <= MAX_POINTS_PER_BATCH;
        flushPendingPoints(isLast ? 'end' : 'move');
      }
      isPointerDownRef.current = false;
      activeStrokeIdRef.current = null;
      activePointsRef.current = [];
    }, [flushPendingPoints, upsertShapeGeometry]);

    useEffect(() => {
      const handleGlobalPointerUp = () => {
        if (isPointerDownRef.current) {
          endCurrentStroke();
        }
      };
      window.addEventListener('pointerup', handleGlobalPointerUp);
      window.addEventListener('pointercancel', handleGlobalPointerUp);
      return () => {
        window.removeEventListener('pointerup', handleGlobalPointerUp);
        window.removeEventListener('pointercancel', handleGlobalPointerUp);
        if (emitIntervalRef.current) clearInterval(emitIntervalRef.current);
      };
    }, [endCurrentStroke]);

    const paletteToRender = highContrast
      ? [
          { hex: '#000000', name: 'Preto Puro' },
          { hex: '#DC2626', name: 'Vermelho Alto Contraste' },
          { hex: '#2563EB', name: 'Azul Alto Contraste' },
          { hex: '#15803D', name: 'Verde Alto Contraste' },
          { hex: '#D97706', name: 'Âmbar Alto Contraste' },
          { hex: '#7E22CE', name: 'Roxo Alto Contraste' },
        ]
      : DRAWING_PALETTE;

    return (
      <div className="flex flex-col gap-2 w-full">
        {/* CLEAN, COMPACT STUDIO TOOLBAR FOR DRAWER */}
        {canInteract && (
          <div className="bg-white border border-[#E5E8F0] rounded-2xl px-3.5 py-2.5 flex flex-col gap-2.5 shadow-[0_4px_16px_-4px_rgba(32,36,53,0.05)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Primary Tool Selector */}
              <div className="flex items-center gap-1 bg-[#F5F6FA] border border-[#E5E8F0] p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setTool('brush');
                    setActiveShapeId(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    tool === 'brush'
                      ? 'bg-[#FF9F1C] text-[#202435] shadow-xs'
                      : 'text-[#687086] hover:text-[#202435] hover:bg-white'
                  }`}
                >
                  <Brush className="w-3.5 h-3.5" />
                  <span>Pincel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTool('shape')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    tool === 'shape'
                      ? 'bg-[#FF9F1C] text-[#202435] shadow-xs'
                      : 'text-[#687086] hover:text-[#202435] hover:bg-white'
                  }`}
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Formas</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTool('eraser');
                    setActiveShapeId(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    tool === 'eraser'
                      ? 'bg-[#202435] text-white shadow-xs'
                      : 'text-[#687086] hover:text-[#202435] hover:bg-white'
                  }`}
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Borracha</span>
                </button>
              </div>

              {/* Color Palette */}
              <div
                className="flex flex-wrap items-center gap-1.5 px-2 py-1"
                role="radiogroup"
                aria-label="Paleta de cores"
              >
                {paletteToRender.map((swatch) => {
                  const isSelected = tool !== 'eraser' && color === swatch.hex;
                  return (
                    <button
                      key={swatch.hex}
                      type="button"
                      onClick={() => {
                        setColor(swatch.hex);
                        if (tool === 'eraser') setTool('brush');
                        if (activeShapeStroke && activeShapeStroke.shape) {
                          upsertShapeGeometry(
                            activeShapeStroke.id,
                            activeShapeStroke.shape,
                            swatch.hex,
                            undefined,
                            true
                          );
                        }
                      }}
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={swatch.name}
                      title={swatch.name}
                      className={`relative w-6 h-6 rounded-full border-2 transition-transform flex items-center justify-center cursor-pointer ${
                        isSelected
                          ? 'border-[#202435] scale-115 ring-2 ring-[#FF9F1C] z-10'
                          : 'border-[#E5E8F0] hover:scale-110'
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                    >
                      {isSelected && (
                        <Check
                          className={`w-3.5 h-3.5 stroke-[3] ${
                            swatch.hex === '#FACC15' ? 'text-[#202435]' : 'text-white'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setHighContrast((prev) => !prev)}
                  className={`p-1.5 rounded-lg text-xs border transition-colors cursor-pointer ${
                    highContrast
                      ? 'bg-[#202435] border-[#202435] text-white'
                      : 'bg-[#F5F6FA] border-[#E5E8F0] text-[#687086] hover:text-[#202435]'
                  }`}
                  title="Alternar alto contraste"
                >
                  <Contrast className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Stroke Width & Undo/Redo/Clear */}
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1 bg-[#F5F6FA] border border-[#E5E8F0] p-1 rounded-xl"
                  role="group"
                  aria-label="Espessura do traço"
                >
                  {BRUSH_WIDTHS.map((bw) => {
                    const active = brushWidth === bw.size;
                    return (
                      <button
                        key={bw.id}
                        type="button"
                        onClick={() => {
                          setBrushWidth(bw.size);
                          if (activeShapeStroke && activeShapeStroke.shape) {
                            upsertShapeGeometry(
                              activeShapeStroke.id,
                              activeShapeStroke.shape,
                              undefined,
                              bw.size,
                              true
                            );
                          }
                        }}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#FF9F1C] text-[#202435] shadow-xs'
                            : 'text-[#687086] hover:text-[#202435] hover:bg-white'
                        }`}
                        title={`Espessura: ${bw.label}`}
                      >
                        <span
                          className="rounded-full bg-current inline-block"
                          style={{
                            width: Math.max(4, Math.min(14, bw.size * 0.55)),
                            height: Math.max(4, Math.min(14, bw.size * 0.55)),
                          }}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={onUndo}
                    disabled={!hasStrokes}
                    className="p-2 rounded-lg bg-[#F5F6FA] hover:bg-[#EBEEF5] border border-[#E5E8F0] disabled:opacity-40 disabled:pointer-events-none text-[#202435] transition-colors cursor-pointer"
                    title="Desfazer (Ctrl+Z)"
                    aria-label="Desfazer"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={onRedo}
                    className="p-2 rounded-lg bg-[#F5F6FA] hover:bg-[#EBEEF5] border border-[#E5E8F0] text-[#202435] transition-colors cursor-pointer"
                    title="Refazer (Ctrl+Y)"
                    aria-label="Refazer"
                  >
                    <Redo2 className="w-4 h-4" />
                  </button>

                  {!confirmClear ? (
                    <button
                      type="button"
                      onClick={() => setConfirmClear(true)}
                      disabled={!hasStrokes}
                      className="p-2 rounded-lg bg-[#FDF2F2] hover:bg-[#FCE4E4] border border-[#E55353]/30 disabled:opacity-40 disabled:pointer-events-none text-[#E55353] transition-colors cursor-pointer"
                      title="Limpar todo o desenho"
                      aria-label="Limpar desenho"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 bg-[#FDF2F2] border border-[#E55353]/40 rounded-lg px-2 py-1">
                      <button
                        type="button"
                        onClick={() => {
                          strokesRef.current = [];
                          setHasStrokes(false);
                          setActiveShapeId(null);
                          setConfirmClear(false);
                          redrawAllFromRef();
                          onClear();
                        }}
                        className="px-2 py-0.5 rounded-md bg-[#E55353] hover:bg-[#CF3E3E] text-white text-xs font-bold cursor-pointer"
                      >
                        Limpar
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClear(false)}
                        className="px-2 py-0.5 rounded-md bg-white text-[#202435] border border-[#E5E8F0] text-xs font-bold cursor-pointer"
                      >
                        Não
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Secondary Bar: Geometric Shapes & Size/Rotation Controls */}
            {(tool === 'shape' || (activeShapeStroke && activeShapeStroke.shape)) && (
              <div className="bg-[#F5F6FA] border border-[#E5E8F0] rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1">
                  {SHAPE_OPTIONS.map((sh) => {
                    const isSelected = selectedShapeType === sh.id && tool === 'shape';
                    return (
                      <button
                        key={sh.id}
                        type="button"
                        onClick={() => {
                          setSelectedShapeType(sh.id);
                          setTool('shape');
                          if (activeShapeStroke && activeShapeStroke.shape) {
                            upsertShapeGeometry(
                              activeShapeStroke.id,
                              {
                                ...activeShapeStroke.shape,
                                shapeType: sh.id,
                              },
                              undefined,
                              undefined,
                              true
                            );
                          }
                        }}
                        title={sh.label}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#FF9F1C] text-[#202435] border-[#F08C00]'
                            : 'bg-white text-[#202435] border-[#E5E8F0] hover:bg-[#FFF6E5]'
                        }`}
                      >
                        {sh.icon}
                        <span className="hidden sm:inline">{sh.label}</span>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => {
                      const nextFilled = !shapeFilled;
                      setShapeFilled(nextFilled);
                      if (activeShapeStroke && activeShapeStroke.shape) {
                        upsertShapeGeometry(
                          activeShapeStroke.id,
                          {
                            ...activeShapeStroke.shape,
                            filled: nextFilled,
                          },
                          undefined,
                          undefined,
                          true
                        );
                      }
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      (activeShapeStroke?.shape?.filled ?? shapeFilled)
                        ? 'bg-[#16A879] text-white border-[#128C65]'
                        : 'bg-white text-[#202435] border-[#E5E8F0] hover:bg-[#FFF6E5]'
                    }`}
                  >
                    <PaintBucket className="w-3.5 h-3.5" />
                    <span>
                      {(activeShapeStroke?.shape?.filled ?? shapeFilled)
                        ? 'Preenchida'
                        : 'Contorno'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInsertShapeCenter()}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FF9F1C] hover:bg-[#FFBF3F] text-[#202435] border border-[#F08C00] font-bold text-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Inserir</span>
                  </button>
                </div>

                {activeShapeStroke && activeShapeStroke.shape && (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <RotateCw className="w-3.5 h-3.5 text-[#FF9F1C]" />
                      <span className="text-[11px] font-bold text-[#202435]">
                        Girar ({Math.round(activeShapeStroke.shape.rotation ?? 0)}°)
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={360}
                        value={Math.round(activeShapeStroke.shape.rotation ?? 0)}
                        onChange={(e) => {
                          const newRot = Number(e.target.value);
                          upsertShapeGeometry(
                            activeShapeStroke.id,
                            {
                              ...activeShapeStroke.shape!,
                              rotation: newRot,
                            },
                            undefined,
                            undefined,
                            true
                          );
                        }}
                        className="w-24 accent-[#FF9F1C] cursor-pointer h-1.5"
                        title="Arraste para girar a forma em 360° ou use a alça acima da forma"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const cur = activeShapeStroke.shape?.rotation ?? 0;
                          const nextRot = (cur + 45) % 360;
                          upsertShapeGeometry(
                            activeShapeStroke.id,
                            {
                              ...activeShapeStroke.shape!,
                              rotation: nextRot,
                            },
                            undefined,
                            undefined,
                            true
                          );
                        }}
                        className="px-1.5 py-0.5 rounded bg-white border border-[#E5E8F0] hover:bg-[#FFF6E5] text-[#202435] text-[10px] font-bold cursor-pointer"
                        title="Girar +45°"
                      >
                        +45°
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-[#202435]">Largura</span>
                      <input
                        type="range"
                        min={4}
                        max={95}
                        value={Math.round(activeShapeStroke.shape.w * 100)}
                        onChange={(e) => {
                          const newW = Number(e.target.value) / 100;
                          upsertShapeGeometry(
                            activeShapeStroke.id,
                            {
                              ...activeShapeStroke.shape!,
                              w: newW,
                            },
                            undefined,
                            undefined,
                            true
                          );
                        }}
                        className="w-16 accent-[#FF9F1C] cursor-pointer h-1.5"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-[#202435]">Altura</span>
                      <input
                        type="range"
                        min={4}
                        max={95}
                        value={Math.round(activeShapeStroke.shape.h * 100)}
                        onChange={(e) => {
                          const newH = Number(e.target.value) / 100;
                          upsertShapeGeometry(
                            activeShapeStroke.id,
                            {
                              ...activeShapeStroke.shape!,
                              h: newH,
                            },
                            undefined,
                            undefined,
                            true
                          );
                        }}
                        className="w-16 accent-[#FF9F1C] cursor-pointer h-1.5"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveShapeId(null)}
                      title="Você também pode simplesmente clicar fora da forma para fixá-la"
                      className="px-2.5 py-1 rounded-lg bg-[#202435] hover:bg-[#2E344B] text-white text-[11px] font-bold cursor-pointer"
                    >
                      Fixar (ou clique fora)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* LARGE, UNOBSTRUCTED DRAWING BOARD */}
        <div
          className={`relative w-full aspect-[960/560] canvas-board-frame rounded-2xl overflow-hidden transition-all ${
            canInteract ? 'ring-2 ring-[#FF9F1C]/60' : ''
          }`}
        >
          <canvas
            ref={canvasRef}
            width={LOGICAL_WIDTH}
            height={LOGICAL_HEIGHT}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endCurrentStroke}
            onPointerCancel={endCurrentStroke}
            style={{ touchAction: 'none' }}
            aria-label="Tela de desenho da rodada"
            className={`w-full h-full block select-none ${
              canInteract
                ? tool === 'shape'
                  ? 'cursor-move'
                  : 'cursor-crosshair'
                : 'cursor-default'
            }`}
          />
        </div>
      </div>
    );
  }
);
