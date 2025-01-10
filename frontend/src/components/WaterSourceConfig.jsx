import "bootstrap/dist/css/bootstrap.css";
import { useEffect, useState } from "react";
import axios from "axios";

export default function WaterSourceConfig() {
  const [criticalLevel, setCriticalLevel] = useState(0);
  const [maxNormalLevel, setMaxNormalLevel] = useState(0);
  const [message, setMessagge] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const apiURL = import.meta.env.VITE_RASPBERRY_PI_API;

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      const { data } = await axios.get(apiURL + "/get_levels");
      setCriticalLevel(data.critical);
      setMaxNormalLevel(data.max_normal);
    } catch (err) {
      setError("Failed to fetch water levels");
      console.error("Error fetching levels:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessagge("");
    setError("");
    setLoading(true);

    try {
      const { data } = await axios.post(apiURL + "/set_levels", {
        critical: parseInt(criticalLevel),
        max_normal: parseInt(maxNormalLevel),
      });

      setMessagge(data.message);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update levels");
      console.error("Error updating levels:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container my-4 p-4 bg-light rounded shadow-sm">
      <h4 className="text-center mb-4">Water Source Configuration</h4>
      {message && (
        <div
          className="alert alert-success alert-dismissible fade show"
          role="alert"
        >
          {message}
          <button
            type="button"
            className="btn-close"
            onClick={() => setMessagge(null)}
            data-bs-dismiss="alert"
            aria-label="Close"
          ></button>
        </div>
      )}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="row g-3 align-items-center justify-content-center">
          <div className="col-md-auto">
            <label htmlFor="criticalLevel" className="form-label fw-semibold">
              Critical water level:
            </label>
          </div>
          <div className="col-md-2">
            <input
              type="number"
              id="criticalLevel"
              className="form-control"
              value={criticalLevel}
              onChange={(e) => setCriticalLevel(e.target.value)}
              required
            />
          </div>
          <div className="col-md-auto">
            <label htmlFor="maxNormalLevel" className="form-label fw-semibold">
              Maximum normal water level:
            </label>
          </div>
          <div className="col-md-2">
            <input
              type="number"
              id="maxNormalLevel"
              className="form-control"
              value={maxNormalLevel}
              onChange={(e) => setMaxNormalLevel(e.target.value)}
              required
            />
          </div>
          <div className="col-md-auto">
            <button
              type="submit"
              className="btn btn-primary px-4"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
