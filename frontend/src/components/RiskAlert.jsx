export default function RiskAlert({ riskLevel }) {
  const getAlertContent = () => {
    switch (riskLevel) {
      case "NONE":
        return (
          <div className="alert alert-success text-center" role="alert">
            <b className="alert-heading">There is no flooding risk.</b>
          </div>
        );
      case "LOW":
        return (
          <div className="alert alert-info text-center" role="alert">
            <b className="alert-heading">
              There is a low flooding risk. Pay attention to the weather.
            </b>
          </div>
        );
      case "HIGH":
        return (
          <div className="alert alert-warning text-center" role="alert">
            <b className="alert-heading">
              There is a high flooding risk. Get ready for evacuation.
            </b>
          </div>
        );
      case "CRITICAL":
        return (
          <div className="alert alert-danger text-center" role="alert">
            <b className="alert-heading">
              Flood is incoming. Evacuate immediately!
            </b>
          </div>
        );
      default:
        return null;
    }
  };

  return <div className="mx-auto">{getAlertContent()}</div>;
}
