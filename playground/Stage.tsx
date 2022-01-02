import {
  PropsWithChildren,
  ComponentProps,
  createRenderEffect,
  untrack,
  onCleanup,
  JSX,
  createEffect,
  mergeProps,
  Show,
  useContext
} from "solid-js";
import { prepare, useThree } from "solid-three";
import * as THREE from "three";
import { OrbitControls, Html } from "solid-drei";
import { DebugLineContext, DebugPointsContext } from "./debug";

const PerspectiveCamera = ({
  position = [10, 5, 10],
  ref
}: PropsWithChildren<ComponentProps<"perspectiveCamera">>) => {
  const set = useThree(({ set }) => set);
  const camera = useThree(({ camera }) => camera);
  const size = useThree(({ size }) => size);

  let cam = (
    <perspectiveCamera far={1000} near={0.1} fov={75} position={position as any} />
  ) as unknown as THREE.PerspectiveCamera;

  createRenderEffect(() => {
    cam.aspect = size().width / size().height;
    cam.updateProjectionMatrix();
  });

  createRenderEffect(() => {
    const oldCam = untrack(() => camera());
    console.log("setting cam", cam);
    set()({ camera: cam });
    onCleanup(() => set()({ camera: oldCam }));
  });

  return cam as unknown as JSX.Element;
};

export function Stage(
  props: Partial<
    PropsWithChildren<{
      camera: {
        lon: number;
        lat: number;
        radius: number;
        target: [number, number, number];
      };
      grid: boolean;
      orbitControls: boolean;
    }>
  >
): JSX.Element {
  const dProps = mergeProps(
    {
      camera: {
        lon: 0,
        lat: 20,
        radius: 4,
        target: [0, 0.8, 0]
      },
      grid: true,
      orbitControls: true
    },
    props
  );
  const gl = useThree(s => s.gl);

  createEffect(() => {
    console.log("gl", gl());
    gl().setClearColor(0x3a3a3a);
  });

  let phi = () => ((90 - dProps.camera.lat) * Math.PI) / 180,
    theta = () => ((dProps.camera.lon + 180) * Math.PI) / 180;

  const debugPoints = useContext(DebugPointsContext);
  const debugLine = useContext(DebugLineContext);

  return (
    <>
      <PerspectiveCamera
        args={[45, window.innerWidth / window.innerHeight, 0.01, 2000]}
        position={[
          -(dProps.camera.radius * Math.sin(phi()) * Math.sin(theta())),
          dProps.camera.radius * Math.cos(phi()),
          -(dProps.camera.radius * Math.sin(phi()) * Math.cos(theta()))
        ]}
      />
      <directionalLight args={[0xffffff, 0.8]} position={[4, 10, 4]} />
      <ambientLight args={[0x404040]} />
      <Show when={dProps.grid}>
        <gridHelper args={[20, 20, 0x0c610c, 0x444444]} />
      </Show>
      <Show when={dProps.orbitControls}>
        <OrbitControls target={dProps.camera.target} />
      </Show>
      {props.children}
      {prepare(debugPoints)}
      {prepare(debugLine)}
    </>
  );
}

export { THREE };
