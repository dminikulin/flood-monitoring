import "bootstrap/dist/css/bootstrap.css";
import axios from "axios";
import { MapPin, Waves, CircleGauge } from "lucide-react";
import { useEffect, useState } from "react";

import RiskAlert from "./RiskAlert";
import StormAlert from "./StormAlert";
import LocationMap from "./LocationMap";

function FutureFloodRisk(risk) {
  switch (risk) {
    case "NONE":
      return "There will be no flooding risk";
    case "LOW":
      return "The flood risk will be low";
    case "HIGH":
      return "The flood risk will be high";
    case "CRITICAL":
      return "The flood risk will be critical";
    default:
      return null;
  }
}

export default function DataPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const apiURL = import.meta.env.VITE_RASPBERRY_PI_API;

  const fetchData = async (isMounted, initialLoad = false) => {
    if (initialLoad) setLoading(true);
    try {
      const response = await axios.get(apiURL + "/flood_data");
      if (isMounted) {
        setData(response.data);
        setError(false);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      if (isMounted) {
        setError(true);
        if (initialLoad) setData(null);
      }
    } finally {
      if (initialLoad && isMounted) setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchData(isMounted, true);
    const interval = setInterval(() => fetchData(isMounted, false), 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="container row mx-auto my-4 p-4">
      {loading && (
        <div className="alert alert-warning" role="alert">
          Loading data from the system...
        </div>
      )}
      {error && (
        <div className="alert alert-danger" role="alert">
          Couldn't get data from the system.
        </div>
      )}
      {data && (
        <>
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">Environmental details</div>
              <div className="card-body">
                <div>
                  <div className="d-flex align-items-center my-3">
                    <Waves className="me-2 text-primary" />
                    <span>Water Level: {data.water_level} cm</span>
                  </div>
                  <div className="d-flex align-items-center my-3">
                    <CircleGauge className="me-2 text-secondary" />
                    <span>Atmospheric Pressure: {data.pressure} hPa</span>
                  </div>
                  <div className="d-flex align-items-center my-3">
                    <MapPin className="me-2 text-success" />
                    <span>Location:</span>
                  </div>
                  {data?.location?.latitude && data?.location?.longitude ? (
                    <div className="ps-4">
                      <div className="my-1">
                        Latitude: {data.location.latitude}°
                      </div>
                      <div className="my-1">
                        Longitude: {data.location.longitude}°
                      </div>
                    </div>
                  ) : (
                    <div className="ps-4">
                      <span>Location is not available yet</span>
                    </div>
                  )}
                  <div className="my-3">
                    <RiskAlert riskLevel={data.risk} />
                  </div>
                  {data.storm_possibility && (
                    <div className="my-3">
                      <StormAlert />
                    </div>
                  )}
                  <div className="d-flex align-items-center my-3">
                    <span>Predictions: </span>
                  </div>
                  {data?.predictions?.predicted_level &&
                  data?.predictions?.predicted_risk ? (
                    <div className="ps-4">
                      {data?.predictions?.predicted_level <= 0 ? (
                        <div className="my-1 text-danger">
                          In 10 minutes, the water will overflow from the water
                          source
                        </div>
                      ) : (
                        <div className="ps-4">
                          <div className="my-1">
                            In 10 minutes, the water levels will reach{" "}
                            {data.predictions.predicted_level} cm
                          </div>
                          <div className="my-1">
                            {FutureFloodRisk(data.predictions.predicted_risk)}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="ps-4">
                      <span>Predictions are not available yet</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card">
              <div className="card-header">Location</div>
              <div className="card-body">
                {data?.location?.latitude && data?.location?.longitude ? (
                  <LocationMap location={data?.location} />
                ) : (
                  <div>Location is not available yet</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
