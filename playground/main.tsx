import { render } from "solid-js/web";
import { Canvas } from "solid-three";
import { Stage } from "./Stage";
import "../examples/threejs/_lib/Starter.css";
import { Example } from "./007_Character";
function App() {
  return (
    <Canvas
      height="100vh"
      width="100vw"
      gl={{
        antialias: true,
        alpha: true
      }}
    >
      <Stage>
        <Example />
      </Stage>
    </Canvas>
  );
}

render(() => <App />, document.getElementById("app")!);
