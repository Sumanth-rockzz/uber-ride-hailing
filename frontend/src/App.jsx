import { useState } from "react";
import axios from "axios";

function App() {
  const [rideId, setRideId] = useState("");
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(false);

  const createRide = async () => {
    try {
      setLoading(true);

      const res = await axios.post("http://localhost:3001/api/rides", {
        "riderId": "user2",
      "pickup": "Bangalore,urban",
      "destination": "Airport,devanahalli"
      });

      setRide(res.data);
      setRideId(res.data.id);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRide = async (id) => {
    try {
      const res = await axios.get(`http://localhost:3001/api/rides/${id}`);
      setRide(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // 🔥 polling for live updates
  const startPolling = (id) => {
    setInterval(() => {
      getRide(id);
    }, 10000);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>🚖 Ride App</h1>

      <button onClick={createRide} disabled={loading}>
        {loading ? "Creating..." : "Create Ride"}
      </button>

      {rideId && (
        <button onClick={() => startPolling(rideId)}>
          Start Live Tracking
        </button>
      )}

      {ride && (
        <div style={{ marginTop: "20px" }}>
          <h3>Ride Details</h3>
          <p>ID: {ride.id}</p>
          <p>Status: {ride.status}</p>
        </div>
      )}
    </div>
  );
}

export default App;