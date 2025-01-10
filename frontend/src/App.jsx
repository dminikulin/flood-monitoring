import "bootstrap/dist/css/bootstrap.css";
import WaterSourceConfig from "./components/WaterSourceConfig";
import DataPanel from "./components/DataPanel";

export default function App() {
  return (
    <div className="container-fluid px-4 py-3">
      <div className="row">
        <div className="col-12">
          <h1 className="text-center fw-bold mb-4">Flood monitoring</h1>
          <WaterSourceConfig />
          <DataPanel />
        </div>
      </div>
    </div>
  );
}
