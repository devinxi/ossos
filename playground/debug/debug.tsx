import { createContext, createRenderEffect, useContext } from "solid-three";
import ShapePointsMesh from "./DebugPointsMesh";
import DynLineMesh from "./DebugLineMesh";

export const debug = {
  pnt: new ShapePointsMesh(),
  ln: new DynLineMesh()
};

export const DebugPointsContext = createContext(debug.pnt);
export const DebugLineContext = createContext(debug.ln);

export function DebugPoint(props: {
  point: [number, number, number] | number[];
  color?: number;
  size?: number;
  shape?: number;
}) {
  const context = useContext(DebugPointsContext);

  createRenderEffect(() => {
    context.add(props.point, props.color, props.size, props.shape);
  });

  return <></>;
}

export function DebugLine(props: {
  p0: [number, number, number];
  p1: [number, number, number];
  color0: number;
  color1: number;
  isDashed: number;
}) {
  const context = useContext(DebugLineContext);

  createRenderEffect(() => {
    context.add(props.p1, props.p1, props.color0, props.color1, props.isDashed);
  });

  return <></>;
}
